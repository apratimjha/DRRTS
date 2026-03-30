const neo4j = require('neo4j-driver');

let driver;

const initDriver = (uri, user, password) => {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
};

const getDriver = () => driver;

const closeDriver = async () => {
    if (driver) await driver.close();
};

const runQuery = async (query, params = {}) => {
    const session = driver.session();
    try {
        return await session.run(query, params);
    } finally {
        await session.close();
    }
};

// Seed a 5x5 Grid
const initGraph = async () => {
    const session = driver.session();
    try {
        // Check if graph exists
        const result = await session.run('MATCH (n:Location) RETURN count(n) AS count');
        if (result.records[0].get('count').toNumber() > 0) {
            console.log("✅ Graph already exists. Skipping seed.");
            return;
        }

        console.log("⚡ Seeding 5x5 Grid Graph...");

        // Create 25 Locations
        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                // Lat/Lng centered roughly around 20.59, 78.96 (Nagpur/India center from App.jsx)
                // Grid spacing approx 0.1 degrees
                const lat = 20.4 + (x * 0.1);
                const lng = 78.8 + (y * 0.1);

                await session.run(`
                    CREATE (l:Location {id: $id, x: $x, y: $y, lat: $lat, lng: $lng})
                `, { id: `loc_${x}_${y}`, x, y, lat, lng });
            }
        }

        // Create Roads (Horizontal & Vertical neighbors)
        await session.run(`
            MATCH (l1:Location), (l2:Location)
            WHERE abs(l1.x - l2.x) + abs(l1.y - l2.y) = 1
            MERGE (l1)-[:ROAD {cost: 1.0}]->(l2)
        `);

        // Create Multiple Default Responders (Multi-Agent Fleet)
        console.log("🚑 Seeding responder fleet...");
        await addResponder({ id: "responder_alpha", name: "Alpha Unit", lat: 20.4, lng: 78.8 });    // Top-left
        await addResponder({ id: "responder_beta", name: "Beta Unit", lat: 20.4, lng: 79.2 });      // Top-right
        await addResponder({ id: "responder_gamma", name: "Gamma Unit", lat: 20.8, lng: 78.8 });    // Bottom-left
        await addResponder({ id: "responder_delta", name: "Delta Unit", lat: 20.8, lng: 79.2 });    // Bottom-right
        await addResponder({ id: "responder_omega", name: "Omega Unit", lat: 20.6, lng: 79.0 });    // Center

        console.log("✅ Graph Seeded Successfully");

    } catch (err) {
        console.error("❌ Graph Seed Failed:", err);
    } finally {
        await session.close();
    }
};

const addIncident = async (incident) => {
    // 1. Create Incident Node
    // 2. Find nearest Location
    // 3. Link (:Incident)-[:LOCATED_AT]->(:Location)

    // Simple nearest neighbor distance calc
    const query = `
        CREATE (i:Incident {id: $id, type: $type, svi: $svi})
        WITH i
        MATCH (l:Location)
        WHERE COALESCE(l.status, 'OPEN') <> 'BLOCKED'
        WITH i, l, point.distance(point({latitude: $lat, longitude: $lng}), point({latitude: l.lat, longitude: l.lng})) AS dist
        ORDER BY dist ASC LIMIT 1
        MERGE (i)-[:LOCATED_AT]->(l)
        RETURN i, l
    `;

    try {
        await runQuery(query, {
            id: incident._id ? incident._id.toString() : incident.id,
            type: incident.type,
            svi: incident.svi_score,
            lat: incident.coordinates.lat,
            lng: incident.coordinates.lng
        });
        console.log(`✅ Linked Incident ${incident._id || "offline"} to Graph`);
    } catch (err) {
        console.error("❌ Failed to add incident to graph:", err);
    }
};

const addResponder = async ({ id, name, lat, lng }) => {
    const query = `
        MERGE (r:Responder {id: $id})
        SET r.name = $name
        WITH r
        MATCH (l:Location)
        WITH r, l, point.distance(point({latitude: $lat, longitude: $lng}), point({latitude: l.lat, longitude: l.lng})) AS dist
        ORDER BY dist ASC LIMIT 1
        MERGE (r)-[:LOCATED_AT]->(l)
        RETURN r, l
    `;
    await runQuery(query, { id, name, lat, lng });
};

const blockLocation = async (lat, lng) => {
    const query = `
        MATCH (l:Location)
        WITH l, point.distance(point({latitude: $lat, longitude: $lng}), point({latitude: l.lat, longitude: l.lng})) AS dist
        ORDER BY dist ASC LIMIT 1
        SET l.status = 'BLOCKED'
        RETURN l
    `;
    try {
        const result = await runQuery(query, { lat, lng });
        console.log(`⛔ Blocked Location at ${lat}, ${lng}`);
        return result.records[0];
    } catch (err) {
        console.error("❌ Failed to block location:", err);
    }
};

const findShortestPath = async (incidentId) => {
    // Find path from ANY available responder to this incident
    // 🛡️ NOBLE ROUTING: Avoid BLOCKED locations (Polyglot Sync)

    // Phase 1: Check if any responder is CO-LOCATED with the incident (cost 0)
    const colocQuery = `
        MATCH (i:Incident {id: $incidentId})-[:LOCATED_AT]->(loc:Location)
        MATCH (r:Responder)-[:LOCATED_AT]->(loc)
        WHERE COALESCE(loc.status, 'OPEN') <> 'BLOCKED'
        RETURN r.id AS responderId, 
               [{lat: loc.lat, lng: loc.lng}] AS pathCoords,
               0 AS cost
        LIMIT 1
    `;

    const colocResult = await runQuery(colocQuery, { incidentId });
    if (colocResult.records.length > 0) {
        const record = colocResult.records[0];
        return {
            responderId: record.get('responderId'),
            path: record.get('pathCoords'),
            cost: 0
        };
    }

    // Phase 2: Full shortest path for distant responders
    const query = `
        MATCH (i:Incident {id: $incidentId})-[:LOCATED_AT]->(end:Location)
        MATCH (r:Responder)-[:LOCATED_AT]->(start:Location)
        WHERE start <> end
        MATCH p = shortestPath((start)-[:ROAD*]-(end))
        WHERE ALL(n IN nodes(p) WHERE COALESCE(n.status, 'OPEN') <> 'BLOCKED')
        RETURN r.id AS responderId, 
               [n IN nodes(p) | {lat: n.lat, lng: n.lng}] AS pathCoords,
               length(p) AS cost
        ORDER BY cost ASC LIMIT 1
    `;

    const result = await runQuery(query, { incidentId });
    if (result.records.length === 0) return null;

    const record = result.records[0];
    return {
        responderId: record.get('responderId'),
        path: record.get('pathCoords'),
        cost: record.get('cost').toNumber()
    };
};

const getAllResponders = async () => {
    const query = `
        MATCH (r:Responder)-[:LOCATED_AT]->(l:Location)
        RETURN r.id AS id, r.name AS name, l.lat AS lat, l.lng AS lng
    `;
    const result = await runQuery(query);
    return result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        lat: record.get('lat'),
        lng: record.get('lng')
    }));
};

module.exports = {
    initDriver,
    getDriver,
    closeDriver,
    initGraph,
    addIncident,
    addResponder,
    findShortestPath,
    getAllResponders,
    blockLocation
};
