import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

const GATE_ID = 'default';

/**
 * The cutoff before which every session token is dead (unix seconds). It lives
 * in the database (table `session_gate`), not an ephemeral DATA_DIR file, so a
 * restore writes it into the restored state and it survives both the restore
 * and a redeploy (A1). The value is cached in memory after a successful load —
 * one integer compare per request. If it cannot be read, the gate fails closed:
 * every authenticated token is rejected until a load succeeds.
 */
@Injectable()
export class SessionGateService implements OnModuleInit {
  private readonly logger = new Logger(SessionGateService.name);
  private validAfterSec = 0;
  private loaded = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureLoaded();
  }

  /** Load the cutoff once; returns false (fail closed) if it cannot be read. */
  private async ensureLoaded(): Promise<boolean> {
    if (this.loaded) return true;
    try {
      const row = await this.prisma.sessionGate.findUnique({
        where: { id: GATE_ID },
      });
      this.validAfterSec = row ? Number(row.validAfterSec) : 0;
      this.loaded = true;
      return true;
    } catch (err) {
      this.logger.error(
        `Session cutoff unreadable; rejecting tokens (fail closed): ${String(err)}`,
      );
      return false;
    }
  }

  /**
   * The reset cutoff in unix seconds: the moment the last erase or restore ended
   * every session (0 if there has never been one). An offline mutation whose
   * `occurredAt` is before this belongs to the shop as it was before the reset,
   * so the sync path drops it rather than replaying it into the clean data.
   */
  async cutoffSec(): Promise<number> {
    await this.ensureLoaded();
    return this.validAfterSec;
  }

  /** A token is valid only if the cutoff is known and it was issued at/after it. */
  async isValid(iatSec: number | undefined): Promise<boolean> {
    if (!(await this.ensureLoaded())) return false;
    if (this.validAfterSec === 0) return true;
    return typeof iatSec === 'number' && iatSec >= this.validAfterSec;
  }

  /**
   * Invalidate every token issued up to now. Written to the database so it is
   * part of the restored state and survives a restart (the last step of a
   * restore). +1s so a token minted in this same second is also past the cutoff.
   */
  async endAllSessions(): Promise<void> {
    const sec = Math.floor(Date.now() / 1000) + 1;
    await this.prisma.sessionGate.upsert({
      where: { id: GATE_ID },
      create: { id: GATE_ID, validAfterSec: BigInt(sec) },
      update: { validAfterSec: BigInt(sec) },
    });
    this.validAfterSec = sec;
    this.loaded = true;
    this.logger.warn(
      'All sessions ended (tokens before the cutoff are invalid)',
    );
  }
}
