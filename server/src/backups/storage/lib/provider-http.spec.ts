import {
  startFake,
  type FakeServer,
} from '../../../../test/support/fake-http.js';
import {
  fetchWithTimeout,
  ProviderError,
  withDeadline,
} from './provider-http.js';

describe('fetchWithTimeout', () => {
  let server: FakeServer;

  afterEach(async () => {
    if (server) await server.close();
  });

  it('rejects when the server accepts but never responds', async () => {
    server = await startFake(() => {
      // Hold the connection open: never call res.end().
    });
    await expect(fetchWithTimeout(server.url, {}, 100)).rejects.toThrow(
      /timed out/,
    );
  });

  it('returns normally when the server answers in time', async () => {
    server = await startFake((_req, res) => {
      res.statusCode = 200;
      res.end('ok');
    });
    const res = await fetchWithTimeout(server.url, {}, 1000);
    expect(res.status).toBe(200);
  });
});

describe('withDeadline', () => {
  it('rejects a promise that never settles', async () => {
    await expect(
      withDeadline(new Promise(() => {}), 50, 'TELEGRAM upload'),
    ).rejects.toThrow(/timed out/);
  });

  it('passes through a value that settles in time', async () => {
    expect(await withDeadline(Promise.resolve(7), 1000, 'x')).toBe(7);
  });

  it('is a ProviderError on timeout', async () => {
    await expect(
      withDeadline(new Promise(() => {}), 20, 'y'),
    ).rejects.toBeInstanceOf(ProviderError);
  });
});
