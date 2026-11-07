import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALWAYS_TABLES,
  CATALOG_TABLES,
  CONTACTS_TABLES,
  KEPT_TABLES,
  NEVER_ERASED_TABLES,
  RESET_ERASED_KEPT_TABLES,
  RESET_TABLES,
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

  it('never erases a kept table during a data wipe', () => {
    const erased = new Set<string>([
      ...groups.always,
      ...groups.contacts,
      ...groups.catalog,
    ]);
    const keptErased = groups.kept.filter((t) => erased.has(t));
    expect(keptErased).toEqual([]);
  });

  it('labels every KEPT table as either reset-erased or never-erased (no unlabelled tables)', () => {
    const resetKept = new Set<string>(RESET_ERASED_KEPT_TABLES);
    const neverErased = new Set<string>(NEVER_ERASED_TABLES);
    const unlabelled: string[] = [];
    const doubleLabelled: string[] = [];

    for (const table of KEPT_TABLES) {
      const isReset = resetKept.has(table);
      const isNever = neverErased.has(table);
      if (!isReset && !isNever) unlabelled.push(table);
      if (isReset && isNever) doubleLabelled.push(table);
    }

    expect(unlabelled).toEqual([]);
    expect(doubleLabelled).toEqual([]);
    expect(KEPT_TABLES.length).toBe(
      RESET_ERASED_KEPT_TABLES.length + NEVER_ERASED_TABLES.length,
    );
  });

  it('partitions every schema table into reset-erased or never-erased', () => {
    const resetSet = new Set<string>(RESET_TABLES);
    const neverSet = new Set<string>(NEVER_ERASED_TABLES);
    const misplaced: string[] = [];

    for (const table of everyTable) {
      const inReset = resetSet.has(table);
      const inNever = neverSet.has(table);
      if (inReset === inNever) {
        misplaced.push(
          `${table}: inReset=${inReset}, inNever=${inNever} (must be in exactly one)`,
        );
      }
    }

    expect(misplaced).toEqual([]);
    expect(everyTable.length).toBe(
      RESET_TABLES.length + NEVER_ERASED_TABLES.length,
    );
  });
});
