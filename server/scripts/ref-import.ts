import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
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

interface AppleModelRow {
  modelNumber: string;
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  ram: string | null;
  boxCode: string | null;
}

function collectAppleModelNumbers(): AppleModelRow[] {
  const seen = new Set<string>();
  const rows: AppleModelRow[] = [];
  for (const file of BOX_FILES) {
    const parsed = parseCsv(readFileSync(join(LIST_DIR, file), 'utf8'));
    for (const r of parsed) {
      if (r.unit_type?.trim() !== 'retail') continue;
      const rawANums = val(r, 'model_number') ?? val(r, 'a_numbers') ?? '';
      const aNums = (rawANums.match(/A\d{4}/gi) ?? []).map((a) => a.toUpperCase());
      const boxCode = boxCodeKey(r.box_code ?? '');
      const model = val(r, 'model') ?? '';
      const color = val(r, 'color');
      const storage = val(r, 'storage');
      const ram = val(r, 'ram');

      for (const aNum of aNums) {
        const key = `${aNum}|${model}|${color ?? ''}|${storage ?? ''}|${ram ?? ''}|${boxCode}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          modelNumber: aNum,
          brand: 'Apple',
          model,
          color,
          storage,
          ram,
          boxCode: boxCode.length >= 5 ? boxCode : null,
        });
      }
    }
  }
  return rows;
}

interface SamsungRow {
  modelCode: string;
  brand: string;
  model: string;
  series: string | null;
  codename: string | null;
  storageOptions: string[];
  colorOptions: string[];
}

function collectSamsungColors(): Map<string, string[]> {
  const file = join(LIST_DIR, 'samsung-color-suggestions.csv');
  if (!existsSync(file)) return new Map();
  const parsed = parseCsv(readFileSync(file, 'utf8'));
  const byModel = new Map<string, string[]>();
  for (const r of parsed) {
    const model = val(r, 'model');
    const color = val(r, 'color');
    if (!model || !color) continue;
    const list = byModel.get(model) ?? [];
    if (!list.includes(color)) list.push(color);
    byModel.set(model, list);
  }
  return byModel;
}

function collectSamsungStorages(): Map<string, string[]> {
  const file = join(LIST_DIR, 'samsung-ram-storage.csv');
  if (!existsSync(file)) return new Map();
  const parsed = parseCsv(readFileSync(file, 'utf8'));
  const byModel = new Map<string, string[]>();
  for (const r of parsed) {
    const model = val(r, 'model');
    const raw = val(r, 'storage_gb');
    if (!model || !raw) continue;
    const parts = raw.split(/\s+/).filter(Boolean);
    const formatted = parts.map((p) => (p === '1024' ? '1TB' : `${p}GB`));
    byModel.set(model, formatted);
  }
  return byModel;
}

function collectSamsungModelCodes(): SamsungRow[] {
  const parsed = parseCsv(readFileSync(join(LIST_DIR, 'samsung-model-codes.csv'), 'utf8'));
  const colorsByModel = collectSamsungColors();
  const storagesByModel = collectSamsungStorages();
  const byCode = new Map<string, SamsungRow>();
  for (const r of parsed) {
    const raw = val(r, 'model_code');
    if (!raw) continue;
    const modelCode = raw.toUpperCase();
    if (byCode.has(modelCode)) continue;
    const model = val(r, 'model') ?? '';
    byCode.set(modelCode, {
      modelCode,
      brand: 'Samsung',
      model,
      series: val(r, 'series'),
      codename: val(r, 'codename'),
      storageOptions: storagesByModel.get(model) ?? [],
      colorOptions: colorsByModel.get(model) ?? [],
    });
  }
  return [...byCode.values()];
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
  const appleModels = collectAppleModelNumbers();
  const samsungCodes = collectSamsungModelCodes();

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
    await prisma.referenceAppleModelNumber.deleteMany();
    await createManyChunked(appleModels, (data) =>
      prisma.referenceAppleModelNumber.createMany({ data }),
    );
    await prisma.referenceSamsungModelCode.deleteMany();
    await createManyChunked(samsungCodes, (data) =>
      prisma.referenceSamsungModelCode.createMany({ data }),
    );

    console.log('Reference lists imported (replaced):');
    for (const [file, n] of Object.entries(box.perFile)) {
      console.log(`  ${file}: ${n} retail rows read`);
    }
    console.log(`  → ref_apple_box_codes: ${box.rows.length} distinct box codes`);
    console.log(`  → ref_apple_model_numbers: ${appleModels.length} distinct variant rows`);
    console.log(`  samsung-model-codes.csv: ${samsungCodes.length} model codes read`);
    console.log(`  → ref_samsung_model_codes: ${samsungCodes.length} distinct Samsung model codes`);
    console.log(`  imei-tac.csv: ${tac.count} rows read`);
    console.log(`  → ref_imei_tacs: ${tac.rows.length} distinct TACs`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
