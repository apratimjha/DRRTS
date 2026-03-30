const mongoose = require('mongoose');
const { initGraph, blockLocation, findShortestPath, closeDriver, initDriver } = require('./server/neo4j_module');
const Incident = require('./server/models/Incident');

// Mock Env
process.env.MONGO_URI = "mongodb://localhost:27017/drrts";
process.env.NEO4J_URI = "bolt://localhost:7687";
process.env.NEO4J_USER = "neo4j";
process.env.NEO4J_PASSWORD = "password";

async function runValidation() {
    console.log("🧪 Starting Dynamic Obstacle Validation...");

    // 1. Connect to Neo4j
    initDriver(process.env.NEO4J_URI, process.env.NEO4J_USER, process.env.NEO4J_PASSWORD);

    // 2. Mock 'Shortest Path' BEFORE blockage
    // Incident at 20.8, 79.2 (Bottom-Right), Responder at 20.4, 78.8 (Top-Left)
    // Direct path passes through center (20.6, 79.0)
    console.log("🛣️  Calculating initial path...");
    const incidentId = "req_validation_" + Date.now();

    // We need to inject an incident node first for the query to work
    // Manually run cypher to create the test node
    const driver = require('neo4j-driver').driver(process.env.NEO4J_URI, require('neo4j-driver').auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
    const session = driver.session();
    await session.run(`
        CREATE (i:Incident {id: $id})-[:LOCATED_AT]->(l:Location {lat: 20.8, lng: 79.2})
    `, { id: incidentId });
    await session.close();

    const pathBefore = await findShortestPath(incidentId);
    console.log("Path BEFORE blockage cost:", pathBefore.cost);

    // 3. Simulate CDC Trigger (Manually calling blockLocation as CDC is async/process-bound)
    // We block a key node in the middle: 20.6, 79.0
    console.log("🚧 Simulating Road Blockage at Center Node (20.6, 79.0)...");
    await blockLocation(20.6, 79.0);

    // 4. Calculate Path AFTER blockage
    const pathAfter = await findShortestPath(incidentId);
    console.log("Path AFTER blockage cost:", pathAfter.cost);

    if (pathAfter.cost > pathBefore.cost) {
        console.log("✅ SUCCESS: Path Rerouted! Cost increased due to avoiding blockage.");
    } else {
        console.log("❌ FAILURE: Path cost unchanged. Blockage ignored.");
    }

    await closeDriver();
    await driver.close();
    process.exit(0);
}

runValidation();
