import { addIncident, getPendingIncidents, markAsSynced } from './db';

const BACKEND_URL = "http://localhost:5000/api/incidents";

export const saveIncident = async (incident) => {
  if (navigator.onLine) {
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incident),
      });

      if (response.ok) {
        console.log("[ONLINE] Incident sent to backend");
        return true;
      }
    } catch (err) {
      console.warn("[WARN] Backend unreachable, saving offline:", err);
    }
  }

  // If offline or fetch failed
  console.log("[OFFLINE] Saving to local DB");
  await addIncident(incident);
  return false; // Indicates it wasn't sent to backend yet
};

export const retrySync = async () => {
  if (!navigator.onLine) return;

  const pending = await getPendingIncidents();
  if (pending.length === 0) return;

  console.log(`[SYNC] Syncing ${pending.length} pending incidents...`);

  for (const incident of pending) {
    try {
      const { id, synced, ...payload } = incident; // Exclude internal DB fields
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await markAsSynced(id);
        console.log(`[SYNC-OK] Synced incident ${id}`);
      }
    } catch (error) {
      console.error(`[SYNC-FAIL] Failed to sync incident ${incident.id}`, error);
    }
  }
};
