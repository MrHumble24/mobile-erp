import { AsyncLocalStorage } from 'node:async_hooks';

export interface StoreContextSelection {
  /** True when X-Store-Id: all is chosen by a caller with store.all. */
  all: boolean;
  /** Stores in scope: single store id, or all allowed store ids when all=true. */
  storeIds: string[];
  /** True when caller belongs to multiple stores but sent no X-Store-Id header. */
  pendingMultiple?: boolean;
}

const storage = new AsyncLocalStorage<StoreContextSelection>();

export function getStoreSelection(): StoreContextSelection | undefined {
  return storage.getStore();
}

export function runWithStoreSelection<T>(
  selection: StoreContextSelection,
  fn: () => T,
): T {
  return storage.run(selection, fn);
}
