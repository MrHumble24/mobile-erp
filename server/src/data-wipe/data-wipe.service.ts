import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { DestructiveLockService } from '../common/runtime/destructive-lock.service.js';
import { RecoveryService } from '../common/runtime/recovery.service.js';
import { ImageStorageService } from '../device-models/image-storage.service.js';
import { StoresService } from '../stores/stores.service.js';
import { BackupsService } from '../backups/backups.service.js';
import { TelegramService } from '../telegram/telegram.service.js';
import { dataWiped } from '../telegram/messages.js';
import { DataWipeRepository } from './data-wipe.repository.js';
import { DataWipeRunner } from './data-wipe.runner.js';
import {
  DATA_WIPE_CONFIRM_FAILED,
  DATA_WIPE_NO_PASSPHRASE,
  DATA_WIPE_PASSPHRASE_UNREADABLE,
  DATA_WIPE_RUNNING,
  DATA_WIPE_SAFETY_BACKUP_FAILED,
  type WipePreview,
  type WipeRunView,
  type WipeStatusView,
} from './types/data-wipe.types.js';

export interface WipeRequest {
  performedById: string;
  email: string;
  shopName: string;
  password: string;
  contacts: boolean;
  catalog: boolean;
}

/** Orchestrates an all-or-nothing erase. Step order mirrors restore (ADR 0057):
 * confirm → refuse if busy → safety backup → maintenance + erase → end
 * sessions → record + Telegram. Holds the one-at-a-time wipe lock. */
@Injectable()
export class DataWipeService implements OnModuleInit {
  private readonly logger = new Logger(DataWipeService.name);

  constructor(
    private readonly repo: DataWipeRepository,
    private readonly runner: DataWipeRunner,
    private readonly backups: BackupsService,
    private readonly stores: StoresService,
    private readonly auth: AuthService,
    private readonly recovery: RecoveryService,
    private readonly images: ImageStorageService,
    private readonly telegram: TelegramService,
    private readonly lock: DestructiveLockService,
  ) {}

  /** A run left RUNNING by a crash between createRun and the commit becomes
   * FAILED at boot (the erase itself never half-committed — the transaction
   * rolled back), so no row sits RUNNING for ever. */
  async onModuleInit(): Promise<void> {
    await this.repo.markStaleRunsFailed();
  }

  preview(): Promise<WipePreview> {
    return this.repo.preview();
  }

  runs(): Promise<WipeRunView[]> {
    return this.repo.listRuns();
  }

  async status(): Promise<WipeStatusView> {
    const last = await this.repo.latestRun();
    return {
      wiping: this.lock.heldBy() === 'wipe',
      needsManualRecovery: this.recovery.needsManualRecovery(),
      last: last
        ? {
            status: last.statusCode,
            startedAt: last.startedAt.toISOString(),
            finishedAt: last.finishedAt ? last.finishedAt.toISOString() : null,
            error: last.error,
          }
        : null,
    };
  }

  async wipe(req: WipeRequest): Promise<void> {
    // Busy checks + latch are taken synchronously, before any await, so an erase
    // and a restore (which shares the latch) can never both proceed to write the
    // same database. A plain backup running blocks the erase here; the latch
    // blocks a plain backup from starting while this runs (BackupsService).
    this.assertNotBusy();
    if (!this.lock.tryAcquire('wipe')) {
      throw new ConflictException({
        code: DATA_WIPE_RUNNING,
        message: 'A restore or erase is already running',
      });
    }
    try {
      await this.confirm(req.shopName, req.email, req.password);
      await this.run(req);
    } finally {
      this.lock.release();
    }
  }

  private async run(req: WipeRequest): Promise<void> {
    await this.assertPassphraseSet();
    // Catalog picture names must be read before the rows go.
    const images = req.catalog ? await this.repo.catalogImageFileNames() : [];
    const safetyRunId = await this.makeSafetyBackup(req.performedById);

    const record = await this.repo.createRun({
      performedById: req.performedById,
      contacts: req.contacts,
      catalog: req.catalog,
      safetyRunId,
    });

    let counts: Record<string, number> = {};
    let failure: Error | undefined;
    try {
      counts = await this.runner.perform({
        contacts: req.contacts,
        catalog: req.catalog,
        safetyRunId,
      });
    } catch (err) {
      failure = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Data wipe failed: ${failure.message}`);
    }

    // Record the outcome. Past the committed erase this is best-effort: a write
    // failure here must not turn a successful, irreversible erase into a 500 or
    // leave the picture cleanup and notice unreachable.
    await this.recordOutcome(record.id, failure, counts);
    if (failure) throw failure;

    // Only after the erase committed: drop the catalog pictures (never a logo —
    // only the names collected above), then notify the shop.
    if (req.catalog) await this.removeImages(images);
    await this.notify(req);
  }

  private async recordOutcome(
    id: string,
    failure: Error | undefined,
    counts: Record<string, number>,
  ): Promise<void> {
    try {
      await this.repo.finishRun(id, {
        status: failure ? 'FAILED' : 'SUCCESS',
        rowsErased: counts,
        error: failure?.message,
      });
    } catch (err) {
      this.logger.error(`data_wipe_runs outcome write failed: ${String(err)}`);
    }
  }

  /** Shop name typed exactly + the caller's own password, both re-checked. */
  private async confirm(
    shopName: string,
    email: string,
    password: string,
  ): Promise<void> {
    const stores = await this.stores.list(false);
    const nameOk = stores.some((s) => s.name === shopName);
    const passOk = await this.auth.verifyPassword(email, password);
    if (!nameOk || !passOk) {
      throw new ForbiddenException({
        code: DATA_WIPE_CONFIRM_FAILED,
        message: 'The shop name or password did not match',
      });
    }
  }

  private assertNotBusy(): void {
    if (
      this.backups.isRunning() ||
      this.recovery.needsManualRecovery() ||
      this.recovery.restoreInProgress()
    ) {
      throw new ConflictException({
        code: DATA_WIPE_RUNNING,
        message: 'A backup, restore or erase is already running',
      });
    }
  }

  private async assertPassphraseSet(): Promise<void> {
    const { passphraseStatus } = await this.backups.getSettings();
    if (passphraseStatus === 'set') return;
    throw new BadRequestException({
      code:
        passphraseStatus === 'unreadable'
          ? DATA_WIPE_PASSPHRASE_UNREADABLE
          : DATA_WIPE_NO_PASSPHRASE,
      message:
        passphraseStatus === 'unreadable'
          ? 'The stored backup passphrase cannot be read on this server; set it again'
          : 'Set the backup passphrase first so a safety backup can be made',
    });
  }

  /**
   * Make the safety backup and prove it actually opens (header, passphrase,
   * manifest checksums) before anything is erased. A failure here throws — so
   * nothing is erased, and the only undo path is known to work. Uses the run id
   * `startBackup` returned, never "the newest run in the list".
   */
  private async makeSafetyBackup(performedById: string): Promise<string> {
    const safetyRunId = await this.backups.startBackup(performedById, {
      bypassLock: true,
    });
    try {
      await this.backups.verifyBackup(safetyRunId);
    } catch (err) {
      this.logger.error(`Safety backup unusable: ${String(err)}`);
      throw new UnprocessableEntityException({
        code: DATA_WIPE_SAFETY_BACKUP_FAILED,
        message: 'The safety backup could not be verified; nothing was erased',
      });
    }
    return safetyRunId;
  }

  private async removeImages(names: string[]): Promise<void> {
    for (const name of names) {
      await this.images.remove(name).catch((err) => {
        this.logger.warn(`Failed to delete picture ${name}: ${String(err)}`);
      });
    }
  }

  /** Best-effort: the data is already erased, so a notice failure (e.g. no
   * store context for the chat id on a company-wide call) must never surface as
   * a failed wipe. */
  private async notify(req: WipeRequest): Promise<void> {
    try {
      await this.telegram.send(
        dataWiped({
          by: req.email,
          at: new Date(),
          contacts: req.contacts,
          catalog: req.catalog,
        }),
      );
    } catch (err) {
      this.logger.warn(`Data-wipe Telegram notice failed: ${String(err)}`);
    }
  }
}
