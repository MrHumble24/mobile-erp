import { promises as fsp } from 'node:fs';
import {
  ProviderAuthError,
  ProviderError,
  withRetry,
} from './provider-http.js';

/**
 * PUT a file to a resumable-upload session in chunks, retrying a dropped chunk a
 * few times with back-off. Intermediate chunks answer 308 (Drive) or 202
 * (OneDrive); the final chunk answers 200/201 with the created item (its id).
 */
export async function putChunks(opts: {
  sessionUrl: string;
  filePath: string;
  totalSize: number;
  chunkBytes: number;
  /** Drive signs each chunk; OneDrive's session URL is pre-authorized. */
  accessToken?: string;
}): Promise<Record<string, unknown>> {
  const fh = await fsp.open(opts.filePath, 'r');
  try {
    let offset = 0;
    while (offset < opts.totalSize) {
      const end = Math.min(offset + opts.chunkBytes, opts.totalSize);
      const buf = Buffer.allocUnsafe(end - offset);
      await fh.read(buf, 0, end - offset, offset);
      const done = await withRetry(() => putOne(opts, buf, offset, end));
      if (done) return done;
      offset = end;
    }
    throw new ProviderError('Chunked upload finished without a final response');
  } finally {
    await fh.close();
  }
}

async function putOne(
  opts: { sessionUrl: string; totalSize: number; accessToken?: string },
  buf: Buffer,
  offset: number,
  end: number,
): Promise<Record<string, unknown> | null> {
  const headers: Record<string, string> = {
    'Content-Range': `bytes ${offset}-${end - 1}/${opts.totalSize}`,
  };
  if (opts.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;
  const res = await fetch(opts.sessionUrl, {
    method: 'PUT',
    headers,
    body: new Uint8Array(buf),
  });
  if (res.status === 308 || res.status === 202) return null; // resume incomplete
  if (res.ok)
    return (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const msg = `Chunk upload failed (${res.status})`;
  throw res.status === 401 || res.status === 403
    ? new ProviderAuthError(msg)
    : new ProviderError(msg);
}
