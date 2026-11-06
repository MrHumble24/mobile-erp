import { PayloadTooLargeException } from '@nestjs/common';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';
import { byteCap } from './byte-cap.js';

function sink(): Writable {
  return new Writable({ write: (_c, _e, cb) => cb() });
}

describe('byteCap', () => {
  it('passes a stream under the cap through', async () => {
    const data = [Buffer.alloc(10), Buffer.alloc(10)];
    await expect(
      pipeline(Readable.from(data), byteCap(100), sink()),
    ).resolves.toBeUndefined();
  });

  it('errors once the cap is exceeded', async () => {
    const data = [Buffer.alloc(60), Buffer.alloc(60)];
    await expect(
      pipeline(Readable.from(data), byteCap(100), sink()),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });
});
