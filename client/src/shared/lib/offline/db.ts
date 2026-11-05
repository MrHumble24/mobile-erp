import { openDB, type IDBPDatabase } from "idb"

/**
 * One IndexedDB database for everything that must survive a reload offline.
 * Store names are generic keys; this module knows nothing about what the rows
 * mean — slices own their shapes. `meta` is a key/value store for cursors etc.
 */
export const OFFLINE_DB = "mobile-erp-offline"
// v2: devices store re-keyed from `imei` to `id` so serial units (no imei) fit.
// v3: products store added for offline quantity-product sales (ADR 0030).
export const OFFLINE_DB_VERSION = 3

export const STORES = {
  outbox: "outbox",
  devices: "devices",
  partners: "partners",
  products: "products",
  meta: "meta",
} as const

export type StoreName = (typeof STORES)[keyof typeof STORES]

let dbPromise: Promise<IDBPDatabase> | null = null

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(OFFLINE_DB, OFFLINE_DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORES.outbox)) {
          database.createObjectStore(STORES.outbox, { keyPath: "id" })
        }
        // Re-key devices by id: a serial unit has no imei (ADR 0029).
        if (database.objectStoreNames.contains(STORES.devices)) {
          database.deleteObjectStore(STORES.devices)
        }
        database.createObjectStore(STORES.devices, { keyPath: "id" })
        if (!database.objectStoreNames.contains(STORES.partners)) {
          database.createObjectStore(STORES.partners, { keyPath: "id" })
        }
        if (!database.objectStoreNames.contains(STORES.products)) {
          database.createObjectStore(STORES.products, { keyPath: "modelId" })
        }
        if (!database.objectStoreNames.contains(STORES.meta)) {
          database.createObjectStore(STORES.meta)
        }
      },
    })
  }
  return dbPromise
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  return (await db()).getAll(store) as Promise<T[]>
}

export async function idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return (await db()).get(store, key) as Promise<T | undefined>
}

export async function idbPut<T>(store: StoreName, value: T, key?: IDBValidKey): Promise<void> {
  await (await db()).put(store, value, key)
}

export async function idbPutMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (values.length === 0) return
  const tx = (await db()).transaction(store, "readwrite")
  await Promise.all([...values.map((v) => tx.store.put(v)), tx.done])
}

export async function idbDelete(store: StoreName, key: IDBValidKey): Promise<void> {
  await (await db()).delete(store, key)
}
