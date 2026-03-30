const mongoose = require("mongoose");

const BeneficiarySchema = new mongoose.Schema(
    {
        // 🛡️ Cryptographic Dignity (DID)
        // Replaces name/gov_id with a decentralized identifier hash
        did_hash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Zero-Knowledge Proof Verification Status
        // True if the beneficiary has proved eligibility without revealing identity
        zkp_verified: {
            type: Boolean,
            default: false,
        },

        // One-time nonce used for the ZKP challenge
        zkp_nonce: {
            type: String,
        },

        // Aid history (linked by ID, not name)
        aid_received: [{
            incident_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
            timestamp: { type: Date, default: Date.now },
            resource_type: String,
        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model("Beneficiary", BeneficiarySchema);
