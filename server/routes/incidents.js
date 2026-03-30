const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");

/* ================================
   ✅ GET ALL INCIDENTS
================================ */
const neo4j = require("../neo4j_module");
const axios = require('axios'); // For calling AI Engine

/* ================================
   ✅ GET ALL INCIDENTS
================================ */
router.get("/", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ timestamp: -1 });
    res.json(incidents);
  } catch (err) {
    console.error("❌ GET failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   ✅ CREATE INCIDENT
================================ */
router.post("/", async (req, res) => {
  try {
    const incident = new Incident(req.body);
    const saved = await incident.save();
    console.log("✅ Incident saved to Mongo:", saved._id);

    // Sync to Neo4j
    await neo4j.addIncident(saved);

    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ POST failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   ⚡ INIT GRAPH (Dev Tool)
================================ */
router.post("/init-graph", async (req, res) => {
  try {
    await neo4j.initGraph();
    res.json({ message: "Graph initialized" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   🚑 DISPATCH (Shortest Path)
================================ */
router.post("/dispatch", async (req, res) => {
  try {
    const { incidentId } = req.body;
    let result = await neo4j.findShortestPath(incidentId);

    // If no path found, try re-syncing the incident to Neo4j and retry
    if (!result) {
      console.log("⚠️ No path found, attempting to re-sync incident to Neo4j...");
      const incident = await Incident.findById(incidentId);
      if (incident) {
        await neo4j.addIncident(incident);
        result = await neo4j.findShortestPath(incidentId);
      }
    }

    if (!result) {
      return res.status(404).json({ message: "No path found. Please click 'Initialize Graph' first, then try again." });
    }

    // ✅ Update Incident Status in MongoDB
    await Incident.findByIdAndUpdate(incidentId, { status: 'dispatched' });

    res.json(result);
  } catch (err) {
    console.error("Dispatch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   🧬 OPTIMIZE FLEET (AI Engine)
================================ */
router.post("/optimize", async (req, res) => {
  try {
    console.log("🧬 Starting Fleet Optimization...");

    // 1. Get Pending Incidents (from Mongo)
    const incidents = await Incident.find({ status: { $ne: 'resolved' } });

    // 2. Get Available Responders (from Neo4j)
    const responders = await neo4j.getAllResponders();

    if (responders.length === 0) {
      // Seed a default responder if none
      await neo4j.addResponder({ id: "responder_alpha", name: "Alpha Unit", lat: 20.4, lng: 78.8 });
      // Re-fetch
      // For now just error
      return res.status(400).json({ message: "No responders available. Please init graph." });
    }

    // 3. Format Payload for AI Engine
    const payload = {
      requests: incidents.map(inc => ({
        id: inc._id.toString(),
        lat: inc.coordinates.lat,
        lng: inc.coordinates.lng,
        svi: inc.svi_score || 0.5,
        needs_resources: 1
      })),
      vehicles: responders.map(r => ({
        id: r.id,
        capacity: 5,
        start_loc: [r.lat, r.lng]
      }))
    };

    // 4. Call Python AI Engine
    const aiResponse = await axios.post('http://localhost:8000/optimize-routes', payload);

    console.log("✅ AI optimization complete. Fitness:", aiResponse.data.fitness);
    res.json(aiResponse.data);

  } catch (err) {
    console.error("❌ Optimization Failed:", err.message);
    res.status(500).json({ error: err.message, details: err.response?.data });
  }
});

module.exports = router;
