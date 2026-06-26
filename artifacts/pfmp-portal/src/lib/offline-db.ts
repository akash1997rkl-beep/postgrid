import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type SyncOperation =
  | { type: "updateDeliveryStatus"; id: number; status: string }
  | { type: "checkIn"; userId: number }
  | { type: "checkOut"; recordId: number };

export interface SyncQueueEntry {
  id?: number;
  operation: SyncOperation;
  timestamp: number;
  retries: number;
}

interface PFMPSchema extends DBSchema {
  sync_queue: {
    key: number;
    value: SyncQueueEntry;
    indexes: { timestamp: number };
  };
}

let dbPromise: Promise<IDBPDatabase<PFMPSchema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PFMPSchema>("pfmp-offline", 1, {
      upgrade(db) {
        const store = db.createObjectStore("sync_queue", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp");
      },
    });
  }
  return dbPromise;
}

export async function enqueueOperation(operation: SyncOperation): Promise<void> {
  const db = await getDB();
  await db.add("sync_queue", { operation, timestamp: Date.now(), retries: 0 });
}

export async function getPendingOperations(): Promise<SyncQueueEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex("sync_queue", "timestamp");
}

export async function removeOperation(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("sync_queue", id);
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.count("sync_queue");
}

export async function clearQueue(): Promise<void> {
  const db = await getDB();
  await db.clear("sync_queue");
}
