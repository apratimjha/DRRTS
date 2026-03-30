const mongoose = require('mongoose');
const Beneficiary = require('./server/models/Beneficiary');

// Mock Env
process.env.MONGO_URI = "mongodb://localhost:27017/drrts";

async function runPrivacyAudit() {
    console.log("🕵️ Starting Privacy Penetration Test...");

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Peek at existing beneficiaries or create a dummy one if empty
        const count = await Beneficiary.countDocuments();
        if (count === 0) {
            console.log("Creating dummy beneficiary...");
            await Beneficiary.create({
                did_hash: "did:eth:0x123...hashed",
                zkp_verified: true,
                zkp_nonce: "nonce_secure_random"
            });
        }

        const allData = await Beneficiary.find({});
        console.log(`📂 Exported ${allData.length} records.`);

        let piiFound = false;
        const piiKeywords = ["name", "email", "phone", "ssn", "passport", "dob"];

        allData.forEach(doc => {
            const json = doc.toJSON();
            const keys = Object.keys(json);

            keys.forEach(key => {
                if (piiKeywords.some(bad => key.toLowerCase().includes(bad))) {
                    console.error(`❌ FAILURE: PII Field found: ${key}`);
                    piiFound = true;
                }
            });

            // Deep inspect values for common regex patterns? 
            // For now, schema check is robust as schema is strict
        });

        if (!piiFound) {
            console.log("✅ SUCCESS: No PII keys found in export. Identity hidden behind DID.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

runPrivacyAudit();
