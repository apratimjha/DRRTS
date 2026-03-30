require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const neo4j = require("neo4j-driver");

const app = express();
const PORT = process.env.PORT || 5000;

/* ================================
   Middleware
================================ */
app.use(cors());
app.use(express.json());

/* ================================
   MongoDB Connection
================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    // 🛡️ Polyglot Bridge: CDC with retry logic
    function startChangeStream() {
      try {
        const incidentChangeStream = mongoose.connection.collection("incidents").watch([], { fullDocument: 'updateLookup' });

        incidentChangeStream.on("change", async (change) => {
          if (change.operationType === "insert" || change.operationType === "update") {
            const doc = change.fullDocument;

            if (doc && (doc.type === "RoadBlockage" || doc.status === "destroyed")) {
              console.log(`🚧 Polyglot Trigger: Blocking Route at [${doc.coordinates.lat}, ${doc.coordinates.lng}]`);
              await neo4jModule.blockLocation(doc.coordinates.lat, doc.coordinates.lng);
            }
          }
        });

        incidentChangeStream.on("error", (err) => {
          console.error("⚠️ Change Stream error, retrying in 5s...", err.message);
          setTimeout(startChangeStream, 5000);
        });

        console.log("🔗 Polyglot Bridge Active: Watching for Roadmap Changes");
      } catch (err) {
        console.warn("⚠️ Change Stream not ready (replica set may be initializing). Retrying in 5s...");
        setTimeout(startChangeStream, 5000);
      }
    }

    startChangeStream();
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });

/* ================================
   Neo4j Connection
================================ */
const neo4jModule = require('./neo4j_module');

neo4jModule.initDriver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  process.env.NEO4J_USER || "neo4j",
  process.env.NEO4J_PASSWORD || "testpassword"
);

// Verify Neo4j connection and auto-seed graph
(async () => {
  try {
    const driver = neo4jModule.getDriver();
    await driver.verifyConnectivity();
    console.log("✅ Neo4j Connected Successfully");

    // Auto-initialize graph (seeds locations + responders if empty)
    await neo4jModule.initGraph();
    console.log("✅ Neo4j Graph Ready");
  } catch (err) {
    console.error("❌ Neo4j Connection Error:", err);
  }
})();

/* ================================
   Routes
================================ */

// Root Health Check
app.get("/", (req, res) => {
  res.send("🚀 DRRTS Backend Online");
});

// Incident Routes
const incidentRoutes = require("./routes/incidents");
const responderRoutes = require("./routes/responders");

app.use("/api/incidents", incidentRoutes);
app.use("/api/responders", responderRoutes);

/* ================================
   Start Server
================================ */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

/* ================================
   Graceful Shutdown Cleanup
================================ */
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");

  try {
    await neo4jModule.closeDriver();
    console.log("✅ Neo4j Driver Closed");
  } catch (err) {
    console.error("❌ Error Closing Neo4j Driver:", err);
  }

  process.exit(0);
});
