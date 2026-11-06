import { randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import type { ServerResponse } from 'node:http';
import {
  sendJson,
  startFake,
  type FakeServer,
} from '../../../test/support/fake-http.js';
import { GoogleDriveStorage } from './google-drive.storage.js';
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

describe('GoogleDriveStorage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gd-'));
  let server: FakeServer;
  let uploads: Map<string, Buffer>;
  let tokenStatus: number;
  let failNextPut: boolean;

  beforeEach(async () => {
    uploads = new Map();
    tokenStatus = 200;
    failNextPut = false;
    const session = new Map<string, Buffer[]>();
    server = await startFake((req, res, body) => {
      const url = req.url ?? '';
      if (url === '/token') {
        if (tokenStatus !== 200)
          return sendJson(res, tokenStatus, { error: 'invalid_grant' });
        return sendJson(res, 200, { access_token: 'at', expires_in: 3600 });
      }
      if (url.startsWith('/drive/v3/files?q='))
        return sendJson(res, 200, { files: [] });
      if (url === '/drive/v3/files' && req.method === 'POST')
        return sendJson(res, 200, { id: 'folder1' });
      if (url.startsWith('/upload/drive/v3/files?uploadType=resumable')) {
        const id = `up${session.size}`;
        session.set(id, []);
        res.setHeader('location', `${server.url}/session/${id}`);
        return sendJson(res, 200, {});
      }
      if (url.startsWith('/session/') && req.method === 'PUT') {
        if (failNextPut) {
          failNextPut = false;
          res.statusCode = 503;
          return res.end('try again');
        }
        const id = url.split('/session/')[1];
        const range = req.headers['content-range'] ?? '';
        const total = Number(/\/(\d+)$/.exec(range)![1]);
        session.get(id)!.push(body);
        const got = session.get(id)!.reduce((n, b) => n + b.length, 0);
        if (got >= total) {
          const fileId = `file-${id}`;
          uploads.set(fileId, Buffer.concat(session.get(id)!));
          return sendJson(res, 200, { id: fileId });
        }
        res.statusCode = 308;
        return res.end();
      }
      const media = /^\/drive\/v3\/files\/([^?]+)\?alt=media/.exec(url);
      if (media)
        return sendBytes(res, uploads.get(media[1]) ?? Buffer.alloc(0));
      if (/^\/drive\/v3\/files\/.+/.test(url) && req.method === 'DELETE') {
        res.statusCode = 204;
        return res.end();
      }
      return sendJson(res, 404, {});
    });
    process.env.GOOGLE_TOKEN_BASE = `${server.url}`;
    process.env.GOOGLE_API_BASE = `${server.url}`;
  });

  afterEach(async () => {
    delete process.env.GOOGLE_TOKEN_BASE;
    delete process.env.GOOGLE_API_BASE;
    await server.close();
  });

  it('uploads (chunked) and downloads byte for byte', async () => {
    const data = randomBytes(10 * 1024 * 1024); // > one 8 MB chunk
    const path = join(dir, 'a.mbk');
    writeFileSync(path, data);
    const gd = new GoogleDriveStorage();
    const ref = await gd.upload(
      { path, name: 'a.mbk', sizeBytes: data.length },
      dest,
    );
    const back = await collect(await gd.download(ref, dest));
    expect(back.equals(data)).toBe(true);
    await gd.remove(ref, dest);
  });

  it('retries a dropped chunk', async () => {
    const data = randomBytes(2 * 1024 * 1024);
    const path = join(dir, 'b.mbk');
    writeFileSync(path, data);
    failNextPut = true; // the first chunk PUT fails once
    const ref = await new GoogleDriveStorage().upload(
      { path, name: 'b.mbk', sizeBytes: data.length },
      dest,
    );
    expect(uploads.get(ref.ref)!.equals(data)).toBe(true);
  });

  it('marks a revoked login as an auth error', async () => {
    tokenStatus = 400; // invalid_grant on refresh
    const path = join(dir, 'c.mbk');
    writeFileSync(path, Buffer.from('x'));
    await expect(
      new GoogleDriveStorage().upload(
        { path, name: 'c.mbk', sizeBytes: 1 },
        dest,
      ),
    ).rejects.toBeInstanceOf(ProviderAuthError);
  });
});

function sendBytes(res: ServerResponse, buf: Buffer): void {
  res.statusCode = 200;
  res.setHeader('content-length', String(buf.length));
  res.end(buf);
}
