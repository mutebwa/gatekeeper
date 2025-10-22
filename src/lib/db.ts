// src/lib/db.ts
// Implements the IndexedDB storage layer using the 'idb' library.
// This fulfills NFR2.4 (Data Persistence) and Decision 3.1.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Entry } from '../types';

const DB_NAME = 'gatekeeper-db';
const DB_VERSION = 1;

// Define the schema for our database
interface GateKeeperDB extends DBSchema {
  entries: {
    key: string;
    value: Entry;
    indexes: { checkpoint_id: string; client_ts: Date };
  };
  'app-state': {
    key: string;
    value: any;
  };
}

let dbInstance: IDBPDatabase<GateKeeperDB> | null = null;

async function getDB(): Promise<IDBPDatabase<GateKeeperDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<GateKeeperDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create the 'entries' object store for our main data
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'record_id' });
        store.createIndex('checkpoint_id', 'checkpoint_id');
        store.createIndex('client_ts', 'client_ts');
      }

      // Create a simple key-value store for application state like last sync time
      if (!db.objectStoreNames.contains('app-state')) {
        db.createObjectStore('app-state');
      }
    },
  });

  return dbInstance;
}

// --- Abstracted DB Access Functions ---

export const db = {
  // Get a value from the key-value store
  async getAppState<T>(key: string): Promise<T | undefined> {
    return (await getDB()).get('app-state', key);
  },

  // Set a value in the key-value store
  async setAppState(key: string, value: any): Promise<void> {
    await (await getDB()).put('app-state', value, key);
  },

  // Get all entries from the database
  async getAllEntries(): Promise<Entry[]> {
    return (await getDB()).getAll('entries');
  },

  // Add or update an entry
  async saveEntry(entry: Entry): Promise<void> {
    await (await getDB()).put('entries', entry);
  },

  // Bulk add/update entries
  async saveEntries(entries: Entry[]): Promise<void> {
    const tx = (await getDB()).transaction('entries', 'readwrite');
    await Promise.all([...entries.map(entry => tx.store.put(entry)), tx.done]);
  },
};
