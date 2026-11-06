import { existsSync, promises as fsp } from 'node:fs';
import { extractSafe } from './archive.js';

/**
 * Replace the uploads folder with the one from a backup, atomically. The new
 * tree is extracted (safely — no `..`, absolute paths or links) into a sibling
 * directory so the final swap is a same-filesystem rename. On any failure the
 * original folder is put back, so uploads are either fully swapped or untouched.
 */
export async function swapUploadsFromTar(
  uploadsTar: string,
  uploadsDir: string,
): Promise<void> {
  const newDir = `${uploadsDir}.restoring-new`;
  const oldDir = `${uploadsDir}.restoring-old`;

  await fsp.rm(newDir, { recursive: true, force: true });
  await fsp.rm(oldDir, { recursive: true, force: true });
  await fsp.mkdir(newDir, { recursive: true });
  await extractSafe(uploadsTar, newDir);

  let movedOld = false;
  if (existsSync(uploadsDir)) {
    await fsp.rename(uploadsDir, oldDir);
    movedOld = true;
  }
  try {
    await fsp.rename(newDir, uploadsDir);
  } catch (err) {
    if (movedOld) await fsp.rename(oldDir, uploadsDir);
    await fsp.rm(newDir, { recursive: true, force: true });
    throw err;
  }
  await fsp.rm(oldDir, { recursive: true, force: true });
}
