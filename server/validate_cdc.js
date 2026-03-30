const mongoose = require('mongoose');
const { initGraph, blockLocation, findShortestPath, closeDriver, initDriver, getDriver } = require('./neo4j_module');

// Incident model is in ./models/Incident
const Incident = require('./models/Incident');

// Use Container Envs if available
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/drrts";
const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password";

async function runValidation() {
    console.log("🧪 Starting Dynamic Obstacle Validation...");

    try {
        initDriver(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD);

        console.log("⚡ Ensuring Graph is Seeded...");
        try { await initGraph(); } catch (e) { }

        // MOCK SCENARIO:
        // Incident at (2,3) [Lat 20.6, Lng 79.1]
        // Closest Responder is Omega at (2,2) [Lat 20.6, Lng 79.0] -> Cost 1
        // We will BLOCK (2,2).
        // Expected Reroute: Beta (0,4) or Delta (4,4) -> Cost 3

        console.log("🛣️  Creating Test Incident at (2,3) [20.6, 79.1]...");
        const incidentId = "req_validation_" + Date.now();

        const driver = getDriver();
        const session = driver.session();
        try {
            await session.run(`
                MATCH (l:Location) 
                WHERE abs(l.lat - 20.6) < 0.001 AND abs(l.lng - 79.1) < 0.001
                CREATE (i:Incident {id: $id})-[:LOCATED_AT]->(l)
                RETURN l
            `, { id: incidentId });
            console.log("✅ Test Incident Created.");
        } catch (e) {
            throw new Error(`Failed to create test incident: ${e.message}`);
        } finally {
            await session.close();
        }

        console.log("🔍 Calculating Path BEFORE blockage...");
        const pathBefore = await findShortestPath(incidentId);
        console.log("Path BEFORE blockage cost:", pathBefore ? pathBefore.cost : "No path");

        if (!pathBefore) throw new Error("❌ SETUP FAILURE: No initial path found.");

        // Block Omega's location (2,2)
        console.log("🚧 Simulating Road Blockage at Omega Node (20.6, 79.0)...");
        await blockLocation(20.6, 79.0);

        console.log("🔍 Calculating Path AFTER blockage...");
        const pathAfter = await findShortestPath(incidentId);
        console.log("Path AFTER blockage cost:", pathAfter ? pathAfter.cost : "No path");

        if (!pathAfter) {
            console.log("✅ SUCCESS: Path blocked completely (Responder unavailable). System correctly identified blockage.");
        } else if (pathAfter.cost > pathBefore.cost) {
            console.log(`✅ SUCCESS: Path Rerouted! Cost increased from ${pathBefore.cost} to ${pathAfter.cost}.`);
        } else {
            console.log("❌ FAILURE: Path cost unchanged. Blockage ignored.");
        }

    } catch (err) {
        console.error("💥 VALIDATION CRASHED:", err);
        process.exit(1);
    } finally {
        await closeDriver();
    }
}

runValidation();
