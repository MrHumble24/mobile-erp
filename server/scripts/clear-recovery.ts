import 'dotenv/config';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Clears the "manual recovery required" marker after a restore's rollback failed
 * and an operator has fixed the database/uploads by hand (ADR 0051). The next
 * start then leaves maintenance.
 *
 *   pnpm tsx scripts/clear-recovery.ts
 */
const dir = process.env.DATA_DIR?.trim() || './data';
let cleared = false;
for (const name of ['restore.manual-recovery', 'restore.in-progress']) {
  const file = join(dir, name);
  if (existsSync(file)) {
    rmSync(file, { force: true });
    console.log(`removed ${file}`);
    cleared = true;
  }
}
console.log(
  cleared
    ? 'Recovery markers cleared. Restart the server to leave maintenance.'
    : 'No recovery markers were present.',
);
