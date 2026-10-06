import fs from 'fs';
import path from 'path';
import { db as firestoreDb } from '../config/firebase';

const DB_FILE = path.join(process.cwd(), 'localdb.json');

function loadDb(): Record<string, any> {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveDb(data: Record<string, any>) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let dbData = loadDb();

class FileCollection {
  private name: string;

  constructor(name: string) {
    this.name = name;
    if (!dbData[this.name]) {
      dbData[this.name] = {};
    }
  }

  private get collectionData() {
    return dbData[this.name];
  }

  doc(id: string) {
    const self = this;
    return {
      get: async () => {
        const data = self.collectionData[id];
        return {
          exists: !!data,
          id,
          data: () => data,
        };
      },
      set: async (docData: any) => {
        self.collectionData[id] = { ...docData, id };
        saveDb(dbData);
      },
      update: async (updates: any) => {
        const existing = self.collectionData[id] || {};
        self.collectionData[id] = { ...existing, ...updates, id };
        saveDb(dbData);
      },
      delete: async () => {
        delete self.collectionData[id];
        saveDb(dbData);
      },
    };
  }

  where(field: string, op: string, value: any) {
    const all = Object.values(this.collectionData) as any[];
    const filtered = all.filter((item) => {
      if (op === '==') return item[field] === value;
      return true;
    });

    return {
      where: (f2: string, op2: string, v2: any) => {
        const filtered2 = filtered.filter((i) => {
          if (op2 === '==') return i[f2] === v2;
          return true;
        });
        return {
          get: async () => ({
            size: filtered2.length,
            docs: filtered2.map((item) => ({ id: item.id, data: () => item })),
          }),
        };
      },
      orderBy: (_field: string, _dir?: string) => ({
        limit: (n: number) => ({
          get: async () => ({
            size: Math.min(filtered.length, n),
            docs: filtered.slice(0, n).map((item) => ({ id: item.id, data: () => item })),
          }),
        }),
        get: async () => ({
          size: filtered.length,
          docs: filtered.map((item) => ({ id: item.id, data: () => item })),
        }),
      }),
      get: async () => ({
        size: filtered.length,
        docs: filtered.map((item) => ({ id: item.id, data: () => item })),
      }),
    };
  }

  orderBy(_field: string, _dir?: string) {
    const all = Object.values(this.collectionData) as any[];
    return {
      limit: (n: number) => ({
        get: async () => ({
          size: Math.min(all.length, n),
          docs: all.slice(0, n).map((item) => ({ id: item.id, data: () => item })),
        }),
      }),
      get: async () => ({
        size: all.length,
        docs: all.map((item) => ({ id: item.id, data: () => item })),
      }),
    };
  }

  async get() {
    const all = Object.values(this.collectionData) as any[];
    return {
      size: all.length,
      docs: all.map((item) => ({ id: item.id, data: () => item })),
    };
  }

  async add(item: any) {
    const id = item.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.collectionData[id] = { ...item, id };
    saveDb(dbData);
    return { id };
  }
}

const memoryStore = new Map<string, FileCollection>();

function getMemoryCollection(name: string): FileCollection {
  if (!memoryStore.has(name)) {
    memoryStore.set(name, new FileCollection(name));
  }
  return memoryStore.get(name)!;
}

const isFirestoreAvailable =
  Boolean(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

export const appDb = {
  collection(name: string): any {
    if (isFirestoreAvailable && firestoreDb) {
      try {
        return firestoreDb.collection(name);
      } catch (e) {
        return getMemoryCollection(name);
      }
    }
    return getMemoryCollection(name);
  },
};
