import { Injectable } from '@nestjs/common';
import { promises as fsp } from 'node:fs';
import { Readable } from 'node:stream';
import type {
  BackupFile,
  BackupStorage,
  Destination,
  RemoteRef,
  StorageCapabilities,
} from './backup-storage.js';
import { putChunks } from './lib/chunked-upload.js';
import { refreshAccessToken } from './lib/oauth-client.js';
import { googleSpec } from './lib/oauth-providers.js';
import { fetchJson, ProviderError, withRetry } from './lib/provider-http.js';

const FOLDER_NAME = 'Malika Bazaar Backups';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const CHUNK_BYTES = 8 * 1024 * 1024; // multiple of 256 KiB (Drive requirement)

interface DriveSecret {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

function secretOf(dest: Destination): Required<DriveSecret> {
  const s = (dest.secret ?? {}) as DriveSecret;
  if (!s.clientId || !s.clientSecret || !s.refreshToken) {
    throw new ProviderError('Google Drive is not connected');
  }
  return s as Required<DriveSecret>;
}

/** Google Drive via `drive.file` (only files this app made). Resumable, chunked
 * upload into an app-made folder; `about` gives the account name/email. */
@Injectable()
export class GoogleDriveStorage implements BackupStorage {
  readonly code = 'GOOGLE_DRIVE';
  readonly capabilities: StorageCapabilities = {
    list: true,
    download: true,
    delete: true,
    maxPartBytes: null,
  };

  private api(): string {
    return googleSpec().apiBase;
  }

  private async token(dest: Destination): Promise<string> {
    const { clientId, clientSecret, refreshToken } = secretOf(dest);
    const t = await refreshAccessToken(googleSpec(), {
      clientId,
      clientSecret,
      refreshToken,
    });
    return t.accessToken;
  }

  private auth(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }

  async validate(config: unknown, secret: unknown): Promise<void> {
    const dest = { config, secret };
    const token = await this.token(dest);
    // Prove write + delete with a tiny throwaway file.
    const id = await this.simpleUpload(
      token,
      'malika-backup-test',
      Buffer.from('ok'),
    );
    await this.remove({ ref: id }, dest);
  }

  async accountInfo(
    dest: Destination,
  ): Promise<{ accountName?: string; accountEmail?: string }> {
    const token = await this.token(dest);
    const about = await fetchJson<{
      user?: { displayName?: string; emailAddress?: string };
    }>(
      'Google Drive about',
      `${this.api()}/drive/v3/about?fields=user(displayName,emailAddress)`,
      { headers: this.auth(token) },
    );
    return {
      accountName: about.user?.displayName,
      accountEmail: about.user?.emailAddress,
    };
  }

  async upload(file: BackupFile, dest: Destination): Promise<RemoteRef> {
    const token = await this.token(dest);
    const folderId = await this.ensureFolder(token);
    const sessionUrl = await this.initiateResumable(token, file.name, folderId);
    const result = await putChunks({
      sessionUrl,
      filePath: file.path,
      totalSize: file.sizeBytes,
      chunkBytes: CHUNK_BYTES,
      accessToken: token,
    });
    const id = typeof result.id === 'string' ? result.id : '';
    if (!id) throw new ProviderError('Google Drive upload returned no file id');
    return { ref: id };
  }

  async download(ref: RemoteRef, dest: Destination): Promise<Readable> {
    const token = await this.token(dest);
    const res = await fetch(
      `${this.api()}/drive/v3/files/${encodeURIComponent(ref.ref)}?alt=media`,
      { headers: this.auth(token) },
    );
    if (!res.ok || !res.body)
      throw new ProviderError(`Google Drive download failed (${res.status})`);
    return Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
  }

  async remove(ref: RemoteRef, dest: Destination): Promise<void> {
    const token = await this.token(dest);
    const res = await fetch(
      `${this.api()}/drive/v3/files/${encodeURIComponent(ref.ref)}`,
      {
        method: 'DELETE',
        headers: this.auth(token),
      },
    );
    if (!res.ok && res.status !== 404)
      throw new ProviderError(`Google Drive delete failed (${res.status})`);
  }

  private async ensureFolder(token: string): Promise<string> {
    const q = `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`;
    const found = await fetchJson<{ files: { id: string }[] }>(
      'Google Drive list',
      `${this.api()}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
      { headers: this.auth(token) },
    );
    if (found.files[0]) return found.files[0].id;
    const made = await fetchJson<{ id: string }>(
      'Google Drive folder create',
      `${this.api()}/drive/v3/files`,
      {
        method: 'POST',
        headers: { ...this.auth(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME }),
      },
    );
    return made.id;
  }

  private async initiateResumable(
    token: string,
    name: string,
    folderId: string,
  ): Promise<string> {
    return withRetry(async () => {
      const res = await fetch(
        `${this.api()}/upload/drive/v3/files?uploadType=resumable`,
        {
          method: 'POST',
          headers: { ...this.auth(token), 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, parents: [folderId] }),
        },
      );
      const loc = res.headers.get('location');
      if (!res.ok || !loc)
        throw new ProviderError(
          `Google Drive upload init failed (${res.status})`,
        );
      return loc;
    });
  }

  private async simpleUpload(
    token: string,
    name: string,
    body: Buffer,
  ): Promise<string> {
    const folderId = await this.ensureFolder(token);
    const sessionUrl = await this.initiateResumable(token, name, folderId);
    const file = `${process.env.DATA_DIR?.trim() || './data'}/.drive-test`;
    await fsp.mkdir(process.env.DATA_DIR?.trim() || './data', {
      recursive: true,
    });
    await fsp.writeFile(file, body);
    try {
      const result = await putChunks({
        sessionUrl,
        filePath: file,
        totalSize: body.length,
        chunkBytes: CHUNK_BYTES,
        accessToken: token,
      });
      return typeof result.id === 'string' ? result.id : '';
    } finally {
      await fsp.rm(file, { force: true });
    }
  }
}
