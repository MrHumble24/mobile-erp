import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { RecoveryService } from '../common/runtime/recovery.service.js';
import { ImageStorageService } from '../device-models/image-storage.service.js';
import { StoresService } from '../stores/stores.service.js';
import { BackupsRepository } from '../backups/backups.repository.js';
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
export class DataWipeService {
  private readonly logger = new Logger(DataWipeService.name);
  private wiping = false;

  constructor(
    private readonly repo: DataWipeRepository,
    private readonly runner: DataWipeRunner,
    private readonly backups: BackupsService,
    private readonly backupsRepo: BackupsRepository,
    private readonly stores: StoresService,
    private readonly auth: AuthService,
    private readonly recovery: RecoveryService,
    private readonly images: ImageStorageService,
    private readonly telegram: TelegramService,
  ) {}

  preview(): Promise<WipePreview> {
    return this.repo.preview();
  }

  runs(): Promise<WipeRunView[]> {
    return this.repo.listRuns();
  }

  async status(): Promise<WipeStatusView> {
    const last = await this.repo.latestRun();
    return {
      wiping: this.wiping,
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
    await this.confirm(req.shopName, req.email, req.password);
    this.ensureNotBusy();
    this.wiping = true;
    try {
      await this.run(req);
    } finally {
      this.wiping = false;
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

    await this.repo.finishRun(record.id, {
      status: failure ? 'FAILED' : 'SUCCESS',
      rowsErased: counts,
      error: failure?.message,
    });
    if (failure) throw failure;

    // Only after the erase committed: drop the catalog pictures (never a logo —
    // only the names collected above), then notify the shop.
    if (req.catalog) await this.removeImages(images);
    await this.notify(req);
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

  private ensureNotBusy(): void {
    if (
      this.wiping ||
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

  /** Make the safety backup first; a failure here throws, so nothing is erased. */
  private async makeSafetyBackup(
    performedById: string,
  ): Promise<string | null> {
    await this.backups.startBackup(performedById);
    const safety = (await this.backupsRepo.listRuns(1))[0];
    if (!safety?.fileName) {
      throw new Error('Safety backup produced no file; nothing was erased');
    }
    return safety.id;
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
