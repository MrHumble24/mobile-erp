import {
  list as tarList,
  create as tarCreate,
  extract as tarExtract,
} from 'tar';
import { isAbsolute } from 'node:path';

/**
 * Tar packing and *safe* extraction. Node ships no archive format that keeps a
 * directory tree, so this is the one place `tar` is used. On extract we never
 * trust a name from inside the archive: absolute paths, `..`, and non-regular
 * entries (symlinks, hardlinks, devices) are refused outright.
 */

/** Pack a whole directory's contents into `outFile`. */
export async function packDir(dir: string, outFile: string): Promise<void> {
  await tarCreate({ file: outFile, cwd: dir, portable: true }, ['.']);
}

/** Pack specific files (relative to `cwd`) into `outFile`. */
export async function packFiles(
  cwd: string,
  files: string[],
  outFile: string,
): Promise<void> {
  await tarCreate({ file: outFile, cwd, portable: true }, files);
}

export function isUnsafe(entryPath: string): boolean {
  const p = entryPath.replace(/\\/g, '/');
  if (isAbsolute(p) || p.startsWith('/')) return true;
  return p.split('/').some((seg) => seg === '..');
}

/** The top-level name of an entry, ignoring the archive's own `.`/`./` root. */
function topName(entryPath: string): string {
  const p = entryPath.replace(/\\/g, '/').replace(/^\.\//, '');
  return p.split('/')[0] ?? '';
}

/**
 * Throws on the first entry with an absolute path, a `..` segment, a link, or
 * (when `allowedTop` is given) a top-level name outside the expected set.
 */
export async function assertSafeEntries(
  tarFile: string,
  allowedTop?: Set<string>,
): Promise<void> {
  // Record the first violation rather than throwing inside onentry: an
  // exception there leaves tar's file-mode promise hanging.
  let violation: string | undefined;
  const flag = (msg: string) => {
    if (!violation) violation = msg;
  };
  await tarList({
    file: tarFile,
    onentry: (entry) => {
      const path = String(entry.path);
      if (isUnsafe(path)) return flag(`Unsafe archive entry: ${path}`);
      if (entry.type !== 'File' && entry.type !== 'Directory') {
        return flag(`Disallowed archive entry type (${entry.type}): ${path}`);
      }
      if (allowedTop) {
        const top = topName(path);
        if (top && top !== '.' && !allowedTop.has(top)) {
          flag(`Unexpected archive entry: ${path}`);
        }
      }
    },
  });
  if (violation) throw new Error(violation);
}

/** Validate every entry, then extract into `destDir`. */
export async function extractSafe(
  tarFile: string,
  destDir: string,
  allowedTop?: Set<string>,
): Promise<void> {
  await assertSafeEntries(tarFile, allowedTop);
  // Entry names and types were already validated by assertSafeEntries; the
  // filter is a second guard against any unsafe path slipping through.
  await tarExtract({
    file: tarFile,
    cwd: destDir,
    preservePaths: false,
    strict: true,
    filter: (path) => !isUnsafe(String(path)),
  });
}
