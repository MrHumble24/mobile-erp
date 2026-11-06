import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALWAYS_TABLES,
  CATALOG_TABLES,
  CONTACTS_TABLES,
  KEPT_TABLES,
} from './wipe-tables.js';

/** Every `@@map("name")` table name declared in the Prisma schema. */
function schemaTableNames(): string[] {
  const dir = join(process.cwd(), 'prisma', 'schema');
  const names: string[] = [];
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.prisma')) continue;
    const text = readFileSync(join(dir, file), 'utf8');
    for (const m of text.matchAll(/@@map\("([^"]+)"\)/g)) names.push(m[1]);
  }
  return names;
}

describe('wipe-tables classification', () => {
  const groups = {
    always: ALWAYS_TABLES as readonly string[],
    contacts: CONTACTS_TABLES as readonly string[],
    catalog: CATALOG_TABLES as readonly string[],
    kept: KEPT_TABLES as readonly string[],
  };
  const everyTable = schemaTableNames();

  it('finds the schema (sanity: a known table is present)', () => {
    expect(everyTable).toContain('sales');
    expect(everyTable.length).toBeGreaterThan(50);
  });

  it('puts every schema table in exactly one group', () => {
    const misplaced: string[] = [];
    for (const table of everyTable) {
      const hits = Object.values(groups).filter((g) =>
        g.includes(table),
      ).length;
      if (hits !== 1) misplaced.push(`${table} is in ${hits} groups`);
    }
    expect(misplaced).toEqual([]);
  });

  it('classifies no table that the schema does not have', () => {
    const known = new Set(everyTable);
    const unknown = [...Object.values(groups).flat()].filter(
      (t) => !known.has(t),
    );
    expect(unknown).toEqual([]);
  });

  it('never erases a kept table', () => {
    const erased = new Set<string>([
      ...groups.always,
      ...groups.contacts,
      ...groups.catalog,
    ]);
    const keptErased = groups.kept.filter((t) => erased.has(t));
    expect(keptErased).toEqual([]);
  });
});
