import { openDB } from 'idb';

const DB_NAME = 'drrts-db';
const STORE_NAME = 'incidents';

export const initDB = async () => {
    return openDB(DB_NAME, 2, {
        upgrade(db, oldVersion, newVersion, transaction) {
            let store;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            } else {
                store = transaction.objectStore(STORE_NAME);
            }

            if (!store.indexNames.contains('synced')) {
                store.createIndex('synced', 'synced');
            }
        },
    });
};

export const addIncident = async (incident) => {
    try {
        const db = await initDB();
        return db.add(STORE_NAME, { ...incident, synced: false, timestamp: new Date().toISOString() });
    } catch (e) { console.error("DB Add Error", e); }
};

export const getPendingIncidents = async () => {
    try {
        const db = await initDB();
        // Fallback to in-memory filtering if index fails
        const all = await db.getAll(STORE_NAME);
        return all.filter(i => i.synced === false);
    } catch (e) {
        console.warn("Error fetching pending incidents:", e);
        return [];
    }
};

export const markAsSynced = async (id) => {
    const db = await initDB();
    const incident = await db.get(STORE_NAME, id);
    if (incident) {
        incident.synced = true;
        await db.put(STORE_NAME, incident);
    }
};

export const getAllIncidents = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};
