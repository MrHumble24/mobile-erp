import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Same default as secrets/app-key.service.ts; kept inline so common depends on
 * no business module. */
function dataDir(): string {
  return process.env.DATA_DIR?.trim() || './data';
}

/**
 * The cutoff before which every session token is dead. A restore replaces the
 * database, so this cannot live there: it sits in a DATA_DIR file that survives
 * the restore. After a restore ends every session, tokens issued earlier (iat <
 * cutoff) are rejected by the JWT guard. The check is one integer compare per
 * request — the value is cached in memory and only re-read on change.
 */
@Injectable()
export class SessionGateService implements OnModuleInit {
  private readonly logger = new Logger(SessionGateService.name);
  private validAfterSec = 0;

  onModuleInit(): void {
    this.validAfterSec = this.readFile();
  }

  /** A token is valid only if it was issued at or after the cutoff. */
  isTokenValid(iatSec: number | undefined): boolean {
    if (this.validAfterSec === 0) return true;
    return typeof iatSec === 'number' && iatSec >= this.validAfterSec;
  }

  /** Invalidate every token issued up to now (called when a restore finishes). */
  endAllSessions(): void {
    // +1s so a token minted in this same second is also past the cutoff.
    this.validAfterSec = Math.floor(Date.now() / 1000) + 1;
    this.writeFile(this.validAfterSec);
    this.logger.warn(
      'All sessions ended (tokens before the cutoff are now invalid)',
    );
  }

  private filePath(): string {
    return join(dataDir(), 'sessions-valid-after');
  }

  private readFile(): number {
    try {
      const file = this.filePath();
      if (!existsSync(file)) return 0;
      const n = Number(readFileSync(file, 'utf8').trim());
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }

  private writeFile(sec: number): void {
    mkdirSync(dataDir(), { recursive: true, mode: 0o700 });
    writeFileSync(this.filePath(), String(sec), { mode: 0o600 });
  }
}
