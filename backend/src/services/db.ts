import { db as firestoreDb } from '../config/firebase';

// In-memory fallback storage in case Firebase Admin credentials are not yet configured
class MemoryCollection {
  private data = new Map<string, any>();

  async doc(id: string) {
    const self = this;
    return {
      get: async () => ({
        exists: self.data.has(id),
        id,
        data: () => self.data.get(id),
      }),
      set: async (docData: any) => {
        self.data.set(id, { ...docData, id });
      },
      update: async (updates: any) => {
        const existing = self.data.get(id) || {};
        self.data.set(id, { ...existing, ...updates, id });
      },
      delete: async () => {
        self.data.delete(id);
      },
    };
  }

  where(field: string, op: string, value: any) {
    const all = Array.from(this.data.values()).filter((item) => {
      if (op === '==') return item[field] === value;
      return true;
    });

    return {
      where: (f2: string, op2: string, v2: any) => ({
        get: async () => ({
          size: all.filter((i) => i[f2] === v2).length,
          docs: all.filter((i) => i[f2] === v2).map((item) => ({ id: item.id, data: () => item })),
        }),
      }),
      orderBy: (_field: string, _dir?: string) => ({
        limit: (_n: number) => ({
          get: async () => ({
            size: all.length,
            docs: all.map((item) => ({ id: item.id, data: () => item })),
          }),
        }),
        get: async () => ({
          size: all.length,
          docs: all.map((item) => ({ id: item.id, data: () => item })),
        }),
      }),
      get: async () => ({
        size: all.length,
        docs: all.map((item) => ({ id: item.id, data: () => item })),
      }),
    };
  }

  orderBy(_field: string, _dir?: string) {
    const all = Array.from(this.data.values());
    return {
      limit: (n: number) => ({
        get: async () => ({
          size: all.slice(0, n).length,
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
    const all = Array.from(this.data.values());
    return {
      size: all.length,
      docs: all.map((item) => ({ id: item.id, data: () => item })),
    };
  }

  async add(item: any) {
    const id = item.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.data.set(id, { ...item, id });
    return { id };
  }
}

const memoryStore = new Map<string, MemoryCollection>();

function getMemoryCollection(name: string): MemoryCollection {
  if (!memoryStore.has(name)) {
    memoryStore.set(name, new MemoryCollection());
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
