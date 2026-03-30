const express = require("express");
const router = express.Router();
const neo4j = require("../neo4j_module");

/* ================================
   GET ALL RESPONDERS
================================ */
router.get("/", async (req, res) => {
    try {
        const responders = await neo4j.getAllResponders();
        res.json(responders);
    } catch (err) {
        console.error("Error fetching responders:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
