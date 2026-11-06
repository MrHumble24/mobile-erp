import { Injectable } from '@nestjs/common';
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
import { microsoftSpec } from './lib/oauth-providers.js';
import {
  fetchJson,
  fetchWithTimeout,
  ProviderError,
} from './lib/provider-http.js';

// OneDrive upload chunks must be a multiple of 320 KiB.
const CHUNK_BYTES = 320 * 1024 * 20; // ~6.25 MB

interface MsSecret {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

function secretOf(dest: Destination): Required<MsSecret> {
  const s = (dest.secret ?? {}) as MsSecret;
  if (!s.clientId || !s.clientSecret || !s.refreshToken) {
    throw new ProviderError('OneDrive is not connected');
  }
  return s as Required<MsSecret>;
}

/**
 * Microsoft OneDrive via `Files.ReadWrite.AppFolder` (only the app's own
 * folder). Chunked upload session; the drive owner gives the account name.
 * Microsoft rotates the refresh token on every refresh, so the new one is
 * sealed back via `dest.onRefreshToken` (item 6) — the place does not drift.
 */
@Injectable()
export class OneDriveStorage implements BackupStorage {
  readonly code = 'ONEDRIVE';
  readonly capabilities: StorageCapabilities = {
    list: true,
    download: true,
    delete: true,
    maxPartBytes: null,
  };

  private api(): string {
    return microsoftSpec().apiBase;
  }

  private async token(dest: Destination): Promise<string> {
    const { clientId, clientSecret, refreshToken } = secretOf(dest);
    const t = await refreshAccessToken(microsoftSpec(), {
      clientId,
      clientSecret,
      refreshToken,
    });
    // Microsoft rotates the refresh token; seal the new one so we do not drift
    // into "needs reconnecting" (item 6).
    if (
      t.refreshToken &&
      t.refreshToken !== refreshToken &&
      dest.onRefreshToken
    ) {
      await dest.onRefreshToken(t.refreshToken);
    }
    return t.accessToken;
  }

  private auth(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
  }

  async validate(config: unknown, secret: unknown): Promise<void> {
    const dest = { config, secret };
    const token = await this.token(dest);
    const res = await fetchWithTimeout(
      `${this.api()}/v1.0/me/drive/special/approot:/malika-backup-test:/content`,
      {
        method: 'PUT',
        headers: {
          ...this.auth(token),
          'Content-Type': 'application/octet-stream',
        },
        body: Buffer.from('ok'),
      },
    );
    if (!res.ok)
      throw new ProviderError(`OneDrive test upload failed (${res.status})`);
    const item = (await res.json()) as { id: string };
    await this.remove({ ref: item.id }, dest);
  }

  async accountInfo(
    dest: Destination,
  ): Promise<{ accountName?: string; accountEmail?: string }> {
    try {
      const token = await this.token(dest);
      const drive = await fetchJson<{
        owner?: { user?: { displayName?: string; email?: string } };
      }>('OneDrive drive', `${this.api()}/v1.0/me/drive?$select=owner`, {
        headers: this.auth(token),
      });
      return {
        accountName: drive.owner?.user?.displayName,
        accountEmail: drive.owner?.user?.email,
      };
    } catch {
      return {};
    }
  }

  async upload(file: BackupFile, dest: Destination): Promise<RemoteRef> {
    const token = await this.token(dest);
    const session = await fetchJson<{ uploadUrl: string }>(
      'OneDrive upload session',
      `${this.api()}/v1.0/me/drive/special/approot:/${encodeURIComponent(file.name)}:/createUploadSession`,
      {
        method: 'POST',
        headers: { ...this.auth(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: { '@microsoft.graph.conflictBehavior': 'replace' },
        }),
      },
    );
    const result = await putChunks({
      sessionUrl: session.uploadUrl,
      filePath: file.path,
      totalSize: file.sizeBytes,
      chunkBytes: CHUNK_BYTES,
    });
    const id = typeof result.id === 'string' ? result.id : '';
    if (!id) throw new ProviderError('OneDrive upload returned no item id');
    return { ref: id };
  }

  async download(ref: RemoteRef, dest: Destination): Promise<Readable> {
    const token = await this.token(dest);
    const res = await fetchWithTimeout(
      `${this.api()}/v1.0/me/drive/items/${encodeURIComponent(ref.ref)}/content`,
      { headers: this.auth(token) },
    );
    if (!res.ok || !res.body)
      throw new ProviderError(`OneDrive download failed (${res.status})`);
    return Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
  }

  async remove(ref: RemoteRef, dest: Destination): Promise<void> {
    const token = await this.token(dest);
    const res = await fetchWithTimeout(
      `${this.api()}/v1.0/me/drive/items/${encodeURIComponent(ref.ref)}`,
      { method: 'DELETE', headers: this.auth(token) },
    );
    if (!res.ok && res.status !== 404)
      throw new ProviderError(`OneDrive delete failed (${res.status})`);
  }
}
