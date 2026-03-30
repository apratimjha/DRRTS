function validateVectorClock() {
    console.log("🕸️ Starting Mesh Conflict (Vector Clock) Validation...");

    // Scenario: Base state { A: 1, B: 1 }
    // Node A updates: { A: 2, B: 1 }
    // Node B updates: { A: 1, B: 2 }

    const baseClock = { A: 1, B: 1 };

    const clockA = { ...baseClock, A: 2 }; // Field Medic Update
    const clockB = { ...baseClock, B: 2 }; // Lead Doctor Update

    console.log("Base Clock:", baseClock);
    console.log("Node A Clock (Medic):", clockA);
    console.log("Node B Clock (Doctor):", clockB);

    // Check dominance
    const dominates = (c1, c2) => {
        // Returns true if c1 >= c2 for all keys
        const keys = new Set([...Object.keys(c1), ...Object.keys(c2)]);
        for (let k of keys) {
            const v1 = c1[k] || 0;
            const v2 = c2[k] || 0;
            if (v1 < v2) return false;
        }
        return true;
    };

    const A_dominates_B = dominates(clockA, clockB);
    const B_dominates_A = dominates(clockB, clockA);

    console.log(`Does A dominate B? ${A_dominates_B}`);
    console.log(`Does B dominate A? ${B_dominates_A}`);

    if (!A_dominates_B && !B_dominates_A) {
        console.log("✅ SUCCESS: Causality Conflict Detected (Concurrent Edits).");
        console.log("   Action: Both versions preserved for Noble Reconciliation.");
    } else {
        console.log("❌ FAILURE: False ordering detected. Data loss imminent.");
    }
}

validateVectorClock();
