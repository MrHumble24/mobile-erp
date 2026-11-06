import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';

/** A tiny HTTP server for adapter tests — no real network, no dependency. */
export type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  body: Buffer,
) => void | Promise<void>;

export interface FakeServer {
  url: string;
  close: () => Promise<void>;
}

export async function startFake(handler: Handler): Promise<FakeServer> {
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      void Promise.resolve(handler(req, res, Buffer.concat(chunks))).catch(
        () => {
          res.statusCode = 500;
          res.end('error');
        },
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

/** Extract one multipart/form-data field's raw bytes (for Telegram documents). */
export function multipartField(
  body: Buffer,
  contentType: string,
  field: string,
): Buffer | null {
  const m = /boundary=(.+)$/.exec(contentType);
  if (!m) return null;
  const boundary = Buffer.from(`--${m[1]}`);
  let from = 0;
  while (from < body.length) {
    const start = body.indexOf(boundary, from);
    if (start < 0) break;
    const next = body.indexOf(boundary, start + boundary.length);
    if (next < 0) break;
    const part = body.subarray(start + boundary.length, next);
    const headEnd = part.indexOf('\r\n\r\n');
    if (headEnd >= 0) {
      const head = part.subarray(0, headEnd).toString('utf8');
      if (head.includes(`name="${field}"`)) {
        let data = part.subarray(headEnd + 4);
        if (data.subarray(-2).equals(Buffer.from('\r\n')))
          data = data.subarray(0, -2);
        return data;
      }
    }
    from = next;
  }
  return null;
}
