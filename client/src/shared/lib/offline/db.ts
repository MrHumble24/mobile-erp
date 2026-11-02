import { openDB, type IDBPDatabase } from "idb"

/**
 * One IndexedDB database for everything that must survive a reload offline.
 * Store names are generic keys; this module knows nothing about what the rows
 * mean — slices own their shapes. `meta` is a key/value store for cursors etc.
 */
export const OFFLINE_DB = "mobile-erp-offline"
export const OFFLINE_DB_VERSION = 1

export const STORES = {
  outbox: "outbox",
  devices: "devices",
  partners: "partners",
  meta: "meta",
} as const

export type StoreName = (typeof STORES)[keyof typeof STORES]

let dbPromise: Promise<IDBPDatabase> | null = null

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(OFFLINE_DB, OFFLINE_DB_VERSION, {
      upgrade(database) {
        database.createObjectStore(STORES.outbox, { keyPath: "id" })
        database.createObjectStore(STORES.devices, { keyPath: "imei" })
        database.createObjectStore(STORES.partners, { keyPath: "id" })
        database.createObjectStore(STORES.meta)
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
