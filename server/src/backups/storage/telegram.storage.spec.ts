import { randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import {
  multipartField,
  sendJson,
  startFake,
  type FakeServer,
} from '../../../test/support/fake-http.js';
import { TelegramStorage } from './telegram.storage.js';

async function collect(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

describe('TelegramStorage', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tg-'));
  const dest = { config: { chatId: '-100999' }, secret: { botToken: 'TKN' } };
  let server: FakeServer;
  let store: Map<string, Buffer>;
  let messages: string[];

  beforeEach(async () => {
    store = new Map();
    messages = [];
    let n = 0;
    server = await startFake((req, res, body) => {
      const url = req.url ?? '';
      if (url.includes('/sendMessage')) {
        messages.push(JSON.parse(body.toString()).text as string);
        return sendJson(res, 200, { ok: true, result: {} });
      }
      if (url.includes('/sendDocument')) {
        const doc = multipartField(
          body,
          req.headers['content-type'] ?? '',
          'document',
        );
        const id = `f${(n += 1)}`;
        store.set(id, doc ?? Buffer.alloc(0));
        return sendJson(res, 200, {
          ok: true,
          result: { message_id: n, document: { file_id: id } },
        });
      }
      if (url.includes('/getFile')) {
        const id = new URL(`http://x${url}`).searchParams.get('file_id') ?? '';
        return sendJson(res, 200, {
          ok: true,
          result: { file_path: `p/${id}` },
        });
      }
      if (url.includes('/file/bot')) {
        const id = url.split('/p/')[1] ?? '';
        const buf = store.get(id) ?? Buffer.alloc(0);
        res.statusCode = 200;
        res.setHeader('content-length', String(buf.length));
        return res.end(buf);
      }
      return sendJson(res, 404, { ok: false });
    });
    process.env.TELEGRAM_API_BASE = server.url;
  });

  afterEach(async () => {
    delete process.env.TELEGRAM_API_BASE;
    await server.close();
  });

  it('splits a 45 MB file into parts and joins it back byte for byte', async () => {
    const data = randomBytes(45 * 1024 * 1024);
    const path = join(dir, 'big.mbk');
    writeFileSync(path, data);
    const tg = new TelegramStorage();

    const ref = await tg.upload(
      { path, name: 'big.mbk', sizeBytes: data.length },
      dest,
    );
    expect(JSON.parse(ref.ref).parts).toHaveLength(3); // 19 + 19 + 7 MB

    const back = await collect(await tg.download(ref, dest));
    expect(back.equals(data)).toBe(true);
  });

  it('sends a message for a test', async () => {
    await new TelegramStorage().validate(dest.config, dest.secret);
    expect(messages).toHaveLength(1);
  });

  it('fails the join when a part is corrupted', async () => {
    const data = randomBytes(100);
    const path = join(dir, 'small.mbk');
    writeFileSync(path, data);
    const tg = new TelegramStorage();
    const ref = await tg.upload(
      { path, name: 'small.mbk', sizeBytes: data.length },
      dest,
    );
    const parsed = JSON.parse(ref.ref) as { parts: string[] };
    store.set(parsed.parts[0], Buffer.from('tampered'));
    await expect(tg.download(ref, dest).then(collect)).rejects.toThrow(
      /checksum/,
    );
  });
});
