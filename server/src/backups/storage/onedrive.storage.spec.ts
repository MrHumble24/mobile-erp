import { randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ServerResponse } from 'node:http';
import type { Readable } from 'node:stream';
import {
  sendJson,
  startFake,
  type FakeServer,
} from '../../../test/support/fake-http.js';
import { OneDriveStorage } from './onedrive.storage.js';
import { ProviderAuthError } from './lib/provider-http.js';

async function collect(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

const dest = {
  config: {},
  secret: { clientId: 'cid', clientSecret: 'sec', refreshToken: 'rt' },
};

describe('OneDriveStorage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'od-'));
  let server: FakeServer;
  let uploads: Map<string, Buffer>;
  let tokenStatus: number;

  beforeEach(async () => {
    uploads = new Map();
    tokenStatus = 200;
    const session = new Map<string, Buffer[]>();
    server = await startFake((req, res, body) => {
      const url = req.url ?? '';
      if (url.endsWith('/token')) {
        if (tokenStatus !== 200)
          return sendJson(res, tokenStatus, { error: 'invalid_grant' });
        // Rotate: the incoming refresh token becomes the next one (rt → rt2 → rt3).
        const incoming =
          new URLSearchParams(body.toString()).get('refresh_token') ?? 'rt';
        return sendJson(res, 200, {
          access_token: 'at',
          refresh_token: `${incoming}x`,
          expires_in: 3600,
        });
      }
      if (url.includes('createUploadSession')) {
        const id = `s${session.size}`;
        session.set(id, []);
        return sendJson(res, 200, { uploadUrl: `${server.url}/up/${id}` });
      }
      if (url.startsWith('/up/') && req.method === 'PUT') {
        const id = url.split('/up/')[1];
        const total = Number(
          /\/(\d+)$/.exec(req.headers['content-range'] ?? '')![1],
        );
        session.get(id)!.push(body);
        const got = session.get(id)!.reduce((n, b) => n + b.length, 0);
        if (got >= total) {
          uploads.set(`item-${id}`, Buffer.concat(session.get(id)!));
          return sendJson(res, 201, { id: `item-${id}` });
        }
        res.statusCode = 202;
        return res.end();
      }
      const content = /^\/v1\.0\/me\/drive\/items\/([^/]+)\/content/.exec(url);
      if (content)
        return sendBytes(res, uploads.get(content[1]) ?? Buffer.alloc(0));
      if (
        /^\/v1\.0\/me\/drive\/items\/.+/.test(url) &&
        req.method === 'DELETE'
      ) {
        res.statusCode = 204;
        return res.end();
      }
      return sendJson(res, 404, {});
    });
    process.env.MICROSOFT_AUTH_BASE = server.url;
    process.env.MICROSOFT_GRAPH_BASE = server.url;
  });

  afterEach(async () => {
    delete process.env.MICROSOFT_AUTH_BASE;
    delete process.env.MICROSOFT_GRAPH_BASE;
    await server.close();
  });

  it('uploads (session, chunked) and downloads byte for byte', async () => {
    const data = randomBytes(10 * 1024 * 1024);
    const path = join(dir, 'a.mbk');
    writeFileSync(path, data);
    const od = new OneDriveStorage();
    const ref = await od.upload(
      { path, name: 'a.mbk', sizeBytes: data.length },
      dest,
    );
    const back = await collect(await od.download(ref, dest));
    expect(back.equals(data)).toBe(true);
    await od.remove(ref, dest);
  });

  it('marks a revoked login as an auth error', async () => {
    tokenStatus = 400;
    const path = join(dir, 'c.mbk');
    writeFileSync(path, Buffer.from('x'));
    await expect(
      new OneDriveStorage().upload({ path, name: 'c.mbk', sizeBytes: 1 }, dest),
    ).rejects.toBeInstanceOf(ProviderAuthError);
  });

  it('persists the rotated refresh token on each refresh (item 6)', async () => {
    const path = join(dir, 'r.mbk');
    writeFileSync(path, Buffer.from('x'));
    const stored: string[] = [];
    const od = new OneDriveStorage();
    // First upload: rt → rt x; the new token is persisted and read next time.
    let refreshToken = 'rt';
    const onRefreshToken = (t: string) => {
      stored.push(t);
      refreshToken = t;
      return Promise.resolve();
    };
    await od.upload(
      { path, name: 'r.mbk', sizeBytes: 1 },
      {
        config: {},
        secret: { clientId: 'c', clientSecret: 's', refreshToken },
        onRefreshToken,
      },
    );
    await od.upload(
      { path, name: 'r.mbk', sizeBytes: 1 },
      {
        config: {},
        secret: { clientId: 'c', clientSecret: 's', refreshToken },
        onRefreshToken,
      },
    );
    expect(stored).toEqual(['rtx', 'rtxx']);
  });
});

function sendBytes(res: ServerResponse, buf: Buffer): void {
  res.statusCode = 200;
  res.setHeader('content-length', String(buf.length));
  res.end(buf);
}
