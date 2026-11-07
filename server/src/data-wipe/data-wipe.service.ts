import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleInit,
  UnprocessableEntityException,
} from '@nestjs/common';
import { promises as fsp } from 'node:fs';
import { join, resolve } from 'node:path';
import { AuthService } from '../auth/auth.service.js';
import { DestructiveLockService } from '../common/runtime/destructive-lock.service.js';
import { RecoveryService } from '../common/runtime/recovery.service.js';
import { ImageStorageService } from '../device-models/image-storage.service.js';
import { StoresService } from '../stores/stores.service.js';
import { BackupsService } from '../backups/backups.service.js';
import { SetupService } from '../setup/setup.service.js';
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
  type WipeRequest,
  type ResetRequest,
} from './types/data-wipe.types.js';

export type { WipeRequest, ResetRequest };

/** Orchestrates an all-or-nothing erase or factory reset. Step order mirrors
 * restore (ADR 0057, 0061): confirm → refuse if busy → safety backup →
 * maintenance + erase → end sessions → leave maintenance → record + Telegram. */
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
    private readonly setup: SetupService,
  ) {}

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
    const held = this.lock.heldBy();
    return {
      wiping: held === 'wipe' || held === 'reset',
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
    this.assertNotBusy();
    if (!this.lock.tryAcquire('wipe')) {
      throw new ConflictException({
        code: DATA_WIPE_RUNNING,
        message: 'A backup, restore, erase or reset is already running',
      });
    }
    try {
      await this.confirm(req.shopName, req.email, req.password);
      await this.runWipe(req);
    } finally {
      this.lock.release();
    }
  }

  async reset(req: ResetRequest): Promise<void> {
    this.assertNotBusy();
    if (!this.lock.tryAcquire('reset')) {
      throw new ConflictException({
        code: DATA_WIPE_RUNNING,
        message: 'A backup, restore, erase or reset is already running',
      });
    }
    try {
      if (req.sentence !== 'erase everything') {
        throw new BadRequestException({
          code: DATA_WIPE_CONFIRM_FAILED,
          message: 'The confirmation sentence must be "erase everything"',
        });
      }
      await this.confirm(req.shopName, req.email, req.password);
      await this.runReset(req);
    } finally {
      this.lock.release();
    }
  }

  private async runWipe(req: WipeRequest): Promise<void> {
    const images = req.catalog ? await this.repo.catalogImageFileNames() : [];
    await this.executeDestructiveRun({
      performedById: req.performedById,
      email: req.email,
      contacts: req.contacts,
      catalog: req.catalog,
      opName: 'Data wipe',
      action: (safetyRunId) =>
        this.runner.perform({
          contacts: req.contacts,
          catalog: req.catalog,
          safetyRunId,
        }),
    });
    if (req.catalog) await this.removeImages(images);
    await this.notify(req);
  }

  private async runReset(req: ResetRequest): Promise<void> {
    await this.executeDestructiveRun({
      performedById: req.performedById,
      email: req.email,
      contacts: true,
      catalog: true,
      opName: 'Factory reset',
      action: (safetyRunId) => this.runner.performReset({ safetyRunId }),
    });
    await this.clearUploadsDir();
    this.setup.prepareSetupAfterReset();
    await this.notify({ ...req, contacts: true, catalog: true });
  }

  private async executeDestructiveRun(params: {
    performedById: string;
    email: string;
    contacts: boolean;
    catalog: boolean;
    opName: string;
    action: (safetyRunId: string) => Promise<Record<string, number>>;
  }): Promise<void> {
    await this.assertPassphraseSet();
    const safetyRunId = await this.makeSafetyBackup(params.performedById);
    const record = await this.repo.createRun({
      performedById: params.performedById,
      performedByName: params.email,
      contacts: params.contacts,
      catalog: params.catalog,
      safetyRunId,
    });

    let counts: Record<string, number> = {};
    let failure: Error | undefined;
    try {
      counts = await params.action(safetyRunId);
    } catch (err) {
      failure = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`${params.opName} failed: ${failure.message}`);
    }

    await this.recordOutcome(record.id, failure, counts);
    if (failure) throw failure;
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
      this.recovery.restoreInProgress() ||
      this.lock.isHeld()
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
    const unreadable = passphraseStatus === 'unreadable';
    throw new BadRequestException({
      code: unreadable
        ? DATA_WIPE_PASSPHRASE_UNREADABLE
        : DATA_WIPE_NO_PASSPHRASE,
      message: unreadable
        ? 'The stored backup passphrase cannot be read on this server; set it again'
        : 'Set the backup passphrase first so a safety backup can be made',
    });
  }

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

  private async clearUploadsDir(): Promise<void> {
    const dir = resolve(process.env.UPLOADS_DIR?.trim() || './uploads');
    try {
      const files = await fsp.readdir(dir);
      for (const file of files) {
        await fsp.rm(join(dir, file), { recursive: true, force: true });
      }
    } catch (err) {
      this.logger.warn(`Failed to clear uploads directory: ${String(err)}`);
    }
  }

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
