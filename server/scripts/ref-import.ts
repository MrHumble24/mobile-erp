import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { boxCodeKey } from '../src/lookup/lib/code-normalize.js';

/**
 * Loads the free reference lists (docs/reference/device-lists) into
 * ref_apple_box_codes + ref_imei_tacs, replacing what is there. Idempotent and
 * safe on every deploy: it truncates and re-inserts, so two runs leave the same
 * counts. Learned links (ref_model_links) are the shop's own data and are never
 * touched. Only the exact files in ADR 0031 are read; the Samsung colour/memory
 * and picture files are deliberately skipped. Run after `prisma migrate deploy`;
 * on Railway run it once per deploy (see server/README.md).
 */

// Resolved from this file (server/scripts), so it works regardless of cwd.
const LIST_DIR = join(__dirname, '../../docs/reference/device-lists');

const BOX_FILES = [
  'iphone-box-codes.csv',
  'ipad-box-codes.csv',
  'mac-box-codes.csv',
  'watch-box-codes.csv',
  'airpods-box-codes.csv',
];

/** Minimal RFC-4180 CSV reader: handles quoted fields and embedded commas/quotes. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((cols) =>
    Object.fromEntries(header.map((h, idx) => [h, cols[idx] ?? ''])),
  );
}

function val(row: Record<string, string>, key: string): string | null {
  const v = row[key]?.trim();
  return v ? v : null;
}

interface BoxRow {
  boxCode: string;
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
}

/** Reads every box-code file, keeps retail rows, dedupes by box code (first wins). */
function collectBoxCodes(): { rows: BoxRow[]; perFile: Record<string, number> } {
  const byCode = new Map<string, BoxRow>();
  const perFile: Record<string, number> = {};
  for (const file of BOX_FILES) {
    const parsed = parseCsv(readFileSync(join(LIST_DIR, file), 'utf8'));
    let retail = 0;
    for (const r of parsed) {
      if (r.unit_type?.trim() !== 'retail') continue;
      retail++;
      const boxCode = boxCodeKey(r.box_code ?? '');
      if (boxCode.length < 5 || byCode.has(boxCode)) continue;
      byCode.set(boxCode, {
        boxCode,
        brand: 'Apple',
        model: val(r, 'model') ?? '',
        color: val(r, 'color'),
        storage: val(r, 'storage'),
        ram: val(r, 'ram'),
      });
    }
    perFile[file] = retail;
  }
  return { rows: [...byCode.values()], perFile };
}

interface TacRow {
  tac: string;
  brand: string;
  model: string;
}

function collectTacs(): { rows: TacRow[]; count: number } {
  const parsed = parseCsv(readFileSync(join(LIST_DIR, 'imei-tac.csv'), 'utf8'));
  const byTac = new Map<string, TacRow>();
  for (const r of parsed) {
    const tac = (r.tac ?? '').trim();
    if (!/^\d{8}$/.test(tac) || byTac.has(tac)) continue;
    byTac.set(tac, { tac, brand: val(r, 'brand') ?? '', model: val(r, 'model') ?? '' });
  }
  return { rows: [...byTac.values()], count: parsed.length };
}

async function createManyChunked<T>(
  rows: T[],
  insert: (chunk: T[]) => Promise<unknown>,
): Promise<void> {
  const size = 1000;
  for (let i = 0; i < rows.length; i += size) {
    await insert(rows.slice(i, i + size));
  }
}

async function main(): Promise<void> {
  const box = collectBoxCodes();
  const tac = collectTacs();

  // Only the database is needed. Booting the whole app here ran every module's
  // start-up hook under tsx, which has no injection metadata, and crashed.
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    await prisma.referenceAppleBoxCode.deleteMany();
    await createManyChunked(box.rows, (data) =>
      prisma.referenceAppleBoxCode.createMany({ data }),
    );
    await prisma.referenceImeiTac.deleteMany();
    await createManyChunked(tac.rows, (data) =>
      prisma.referenceImeiTac.createMany({ data }),
    );

    console.log('Reference lists imported (replaced):');
    for (const [file, n] of Object.entries(box.perFile)) {
      console.log(`  ${file}: ${n} retail rows read`);
    }
    console.log(`  → ref_apple_box_codes: ${box.rows.length} distinct box codes`);
    console.log(`  imei-tac.csv: ${tac.count} rows read`);
    console.log(`  → ref_imei_tacs: ${tac.rows.length} distinct TACs`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
