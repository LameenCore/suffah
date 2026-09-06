// Hand-rolled IndexedDB store for the offline playground (T61). No `idb` dep.
//
// Three object stores:
//   units   - downloaded lesson + checkpoint content, keyed by nodeId
//   outbox  - checkpoint attempts made offline, waiting to POST when back online
//   drafts  - in-progress checkpoint answers, saved on every keystroke so a
//             mid-checkpoint network drop or reload never loses work
//
// Everything here is browser-only. Guard callers with `typeof window`/`indexedDB`
// checks or a try/catch; a private-mode / blocked-storage browser must degrade,
// not crash.

const DB_NAME = "suffa-offline";
const DB_VERSION = 1;

export const STORE_UNITS = "units";
export const STORE_OUTBOX = "outbox";
export const STORE_DRAFTS = "drafts";

export interface OfflineUnit {
  nodeId: string;
  courseId: string;
  courseName: string;
  title: string;
  /** Persisted lesson content (LessonContent shape) or null if not generated. */
  lesson: unknown;
  /** Answer-stripped checkpoint (CheckpointForStudent shape) or null. */
  checkpoint: unknown;
  savedAt: number;
}

export interface OutboxAttempt {
  /** `${nodeId}` — one pending attempt per node; a re-submit replaces it. */
  nodeId: string;
  answers: Record<string, string>;
  queuedAt: number;
  /** set while a flush is in flight, to keep the SW and the page from double-posting */
  sending?: boolean;
}

export interface CheckpointDraft {
  nodeId: string;
  answers: Record<string, string>;
  updatedAt: number;
}

function isAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isAvailable()) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_UNITS)) {
        db.createObjectStore(STORE_UNITS, { keyPath: "nodeId" });
      }
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, { keyPath: "nodeId" });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "nodeId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("indexedDB request failed"));
        t.oncomplete = () => db.close();
      }),
  );
}

// ---- units --------------------------------------------------------------

export async function saveUnit(unit: OfflineUnit): Promise<void> {
  await tx(STORE_UNITS, "readwrite", (s) => s.put(unit));
}

export async function getUnit(nodeId: string): Promise<OfflineUnit | null> {
  try {
    return (await tx<OfflineUnit | undefined>(STORE_UNITS, "readonly", (s) => s.get(nodeId))) ?? null;
  } catch {
    return null;
  }
}

export async function listUnitIds(): Promise<string[]> {
  try {
    const keys = await tx<IDBValidKey[]>(STORE_UNITS, "readonly", (s) => s.getAllKeys());
    return keys.map(String);
  } catch {
    return [];
  }
}

// ---- outbox ------------------------------------------------------------

export async function enqueueAttempt(nodeId: string, answers: Record<string, string>): Promise<void> {
  const item: OutboxAttempt = { nodeId, answers, queuedAt: Date.now() };
  await tx(STORE_OUTBOX, "readwrite", (s) => s.put(item));
}

export async function readOutbox(): Promise<OutboxAttempt[]> {
  try {
    return (await tx<OutboxAttempt[]>(STORE_OUTBOX, "readonly", (s) => s.getAll())) ?? [];
  } catch {
    return [];
  }
}

export async function deleteOutbox(nodeId: string): Promise<void> {
  await tx(STORE_OUTBOX, "readwrite", (s) => s.delete(nodeId));
}

export async function outboxCount(): Promise<number> {
  try {
    return await tx<number>(STORE_OUTBOX, "readonly", (s) => s.count());
  } catch {
    return 0;
  }
}

// ---- drafts ----------------------------------------------------------

export async function saveDraft(nodeId: string, answers: Record<string, string>): Promise<void> {
  const item: CheckpointDraft = { nodeId, answers, updatedAt: Date.now() };
  try {
    await tx(STORE_DRAFTS, "readwrite", (s) => s.put(item));
  } catch {
    // best-effort; a blocked store just means no crash-recovery this session
  }
}

export async function getDraft(nodeId: string): Promise<Record<string, string> | null> {
  try {
    const d = await tx<CheckpointDraft | undefined>(STORE_DRAFTS, "readonly", (s) => s.get(nodeId));
    return d?.answers ?? null;
  } catch {
    return null;
  }
}

export async function clearDraft(nodeId: string): Promise<void> {
  try {
    await tx(STORE_DRAFTS, "readwrite", (s) => s.delete(nodeId));
  } catch {
    /* noop */
  }
}
