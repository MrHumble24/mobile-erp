import { Injectable } from '@nestjs/common';
import { createReadStream, promises as fsp } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import type { Readable } from 'node:stream';
import type {
  BackupFile,
  BackupStorage,
  RemoteRef,
  StorageCapabilities,
} from './backup-storage.js';

/** The on-server copy of a backup: a folder outside uploads, never served. */
export function backupsDir(): string {
  return resolve(process.env.BACKUPS_DIR?.trim() || './backups');
}

/** Guard against a crafted ref escaping BACKUPS_DIR. */
function refPath(ref: string): string {
  const name = basename(ref);
  if (!name || name !== ref)
    throw new Error(`Invalid backup reference: ${ref}`);
  return join(backupsDir(), name);
}

@Injectable()
export class LocalStorage implements BackupStorage {
  readonly code = 'LOCAL';
  readonly capabilities: StorageCapabilities = {
    list: true,
    download: true,
    delete: true,
    maxPartBytes: null,
  };

  async validate(): Promise<void> {
    await fsp.mkdir(backupsDir(), { recursive: true });
  }

  async upload(file: BackupFile): Promise<RemoteRef> {
    const dir = backupsDir();
    await fsp.mkdir(dir, { recursive: true });
    await fsp.copyFile(file.path, join(dir, file.name));
    return { ref: file.name };
  }

  download(ref: RemoteRef): Promise<Readable> {
    return Promise.resolve(createReadStream(refPath(ref.ref)));
  }

  async exists(ref: RemoteRef): Promise<boolean> {
    try {
      await fsp.access(refPath(ref.ref));
      return true;
    } catch {
      return false;
    }
  }

  async remove(ref: RemoteRef): Promise<void> {
    await fsp.rm(refPath(ref.ref), { force: true });
  }
}
