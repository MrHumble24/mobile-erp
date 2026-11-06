import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionGateService } from './session-gate.service.js';

describe('SessionGateService', () => {
  const prev = process.env.DATA_DIR;
  beforeEach(() => {
    process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'sg-'));
  });
  afterAll(() => {
    process.env.DATA_DIR = prev;
  });

  it('accepts any token before a cutoff is set', () => {
    const gate = new SessionGateService();
    gate.onModuleInit();
    expect(gate.isTokenValid(1000)).toBe(true);
    expect(gate.isTokenValid(undefined)).toBe(true);
  });

  it('rejects tokens issued before the cutoff after ending sessions', () => {
    const gate = new SessionGateService();
    gate.onModuleInit();
    const before = Math.floor(Date.now() / 1000) - 10;
    gate.endAllSessions();
    expect(gate.isTokenValid(before)).toBe(false);
    // A fresh token (issued after the cutoff) is accepted.
    expect(gate.isTokenValid(Math.floor(Date.now() / 1000) + 5)).toBe(true);
  });

  it('persists the cutoff to DATA_DIR so it survives a restart', () => {
    const first = new SessionGateService();
    first.onModuleInit();
    first.endAllSessions();
    const reloaded = new SessionGateService();
    reloaded.onModuleInit();
    expect(reloaded.isTokenValid(Math.floor(Date.now() / 1000) - 10)).toBe(
      false,
    );
  });
});
