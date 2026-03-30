const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },

    reporter_id: {
      type: String,
      required: true,
      default: "anonymous",
    },

    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    svi_score: { type: Number, default: 0 },

    type: {
      type: String,
      required: true,
      enum: ["FloodReport", "MedicalTriage", "ResourceRequest"],
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["active", "dispatched", "resolved"],
      default: "active",
    },

    // 🕰️ Vector Clock for Conflict Resolution
    vector_clock: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

/*
  ✅ IMPORTANT FIX:
  Remove invalid 2dsphere index.
  Your coordinates are lat/lng object, not GeoJSON Point.
*/
module.exports = mongoose.model("Incident", IncidentSchema);
