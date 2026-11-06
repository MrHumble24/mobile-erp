import { existsSync, promises as fsp } from 'node:fs';
import { extractSafe } from './archive.js';

/**
 * Replaces the uploads folder with the one from a backup, as renames only, so
 * the live folder is never half-written and a failure can be undone (A2).
 *
 *   prepare()  — extract the backup's uploads into `<dir>.incoming` (safe
 *                extraction: no `..`, absolute paths or links). Done before the
 *                database is touched, so most failures happen here.
 *   commit()   — rename live → `<dir>.old`, incoming → live.
 *   rollback() — put the original back (from `.old`), or just drop incoming.
 *   finalize() — drop the kept `.old`/`.failed` folders after full success.
 */
export class UploadSwap {
  private committed = false;

  private constructor(
    private readonly live: string,
    private readonly incoming: string,
    private readonly old: string,
    private readonly failed: string,
  ) {}

  static async prepare(
    uploadsTar: string,
    uploadsDir: string,
  ): Promise<UploadSwap> {
    const swap = new UploadSwap(
      uploadsDir,
      `${uploadsDir}.incoming`,
      `${uploadsDir}.old`,
      `${uploadsDir}.failed`,
    );
    await fsp.rm(swap.incoming, { recursive: true, force: true });
    await fsp.rm(swap.old, { recursive: true, force: true });
    await fsp.rm(swap.failed, { recursive: true, force: true });
    await fsp.mkdir(swap.incoming, { recursive: true });
    await extractSafe(uploadsTar, swap.incoming);
    return swap;
  }

  async commit(): Promise<void> {
    const hadLive = existsSync(this.live);
    if (hadLive) await fsp.rename(this.live, this.old);
    try {
      await fsp.rename(this.incoming, this.live);
    } catch (err) {
      // Second rename failed: put the original back so nothing is lost.
      if (hadLive && !existsSync(this.live))
        await fsp.rename(this.old, this.live);
      throw err;
    }
    this.committed = true;
  }

  async rollback(): Promise<void> {
    if (!this.committed) {
      await fsp.rm(this.incoming, { recursive: true, force: true });
      return;
    }
    // Move the failed restore's uploads aside and restore the original.
    await fsp.rm(this.failed, { recursive: true, force: true });
    if (existsSync(this.live)) await fsp.rename(this.live, this.failed);
    if (existsSync(this.old)) await fsp.rename(this.old, this.live);
    await fsp.rm(this.failed, { recursive: true, force: true });
    this.committed = false;
  }

  async finalize(): Promise<void> {
    await fsp.rm(this.old, { recursive: true, force: true });
    await fsp.rm(this.incoming, { recursive: true, force: true });
    await fsp.rm(this.failed, { recursive: true, force: true });
  }
}
