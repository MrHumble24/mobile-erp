import { NotFoundException } from '@nestjs/common';
import type { BackupStorage } from './backup-storage.js';

/**
 * Resolves a storage adapter by provider code. Built from the adapter array the
 * module injects, so no part of the service ever switches on the code.
 */
export class StorageRegistry {
  private readonly byCode: Map<string, BackupStorage>;

  constructor(adapters: BackupStorage[]) {
    this.byCode = new Map(adapters.map((a) => [a.code, a]));
  }

  get(code: string): BackupStorage {
    const adapter = this.byCode.get(code);
    if (!adapter) throw new NotFoundException(`No storage adapter for ${code}`);
    return adapter;
  }

  has(code: string): boolean {
    return this.byCode.has(code);
  }

  /** Provider codes with a registered adapter on this server. */
  codes(): string[] {
    return [...this.byCode.keys()];
  }
}
