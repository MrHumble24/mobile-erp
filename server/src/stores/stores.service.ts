import { Injectable } from '@nestjs/common';
import { StoresRepository } from './stores.repository.js';
import type { StoreIdentity } from './types/store.types.js';

/**
 * The single place that answers "which store is this write for". Today it
 * returns the only store; later it will resolve the signed-in user's chosen
 * store. No other code may query `stores` to pick one — inject this instead.
 */
@Injectable()
export class StoresService {
  constructor(private readonly repo: StoresRepository) {}

  currentStoreId(): Promise<string> {
    return this.repo.currentId();
  }

  /** Store identity, surfaced through the settings API. */
  getIdentity(): Promise<StoreIdentity> {
    return this.repo.getIdentity();
  }

  async updateIdentity(data: Partial<StoreIdentity>): Promise<void> {
    await this.repo.updateIdentity(await this.currentStoreId(), data);
  }
}
