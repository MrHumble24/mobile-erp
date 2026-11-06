import { randomBytes } from 'node:crypto';
import { open, seal } from './aes-gcm.js';

describe('aes-gcm seal/open', () => {
  const key = randomBytes(32);

  it('round-trips the same bytes', () => {
    const msg = Buffer.from('backup-passphrase-пароль', 'utf8');
    expect(open(key, seal(key, msg)).equals(msg)).toBe(true);
  });

  it('fails cleanly with the wrong key', () => {
    const sealed = seal(key, Buffer.from('secret'));
    expect(() => open(randomBytes(32), sealed)).toThrow();
  });

  it('fails when a byte is flipped', () => {
    const sealed = seal(key, Buffer.from('secret'));
    sealed[sealed.length - 1] ^= 0x01;
    expect(() => open(key, sealed)).toThrow();
  });

  it('rejects a non-32-byte key', () => {
    expect(() => seal(randomBytes(16), Buffer.from('x'))).toThrow();
  });
});
