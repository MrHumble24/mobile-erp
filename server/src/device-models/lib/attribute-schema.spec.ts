import { BadRequestException } from '@nestjs/common';
import {
  defaultAttributes,
  normalizeAttributes,
  validateSpecs,
  type AttributeDef,
} from './attribute-schema.js';

describe('normalizeAttributes', () => {
  it('injects a reserved storage select when absent and sorts it first', () => {
    const out = normalizeAttributes([
      {
        key: 'color',
        label: 'Color',
        type: 'select',
        options: ['Black'],
        required: false,
      },
    ]);
    const storage = out.find((a) => a.key === 'storage');
    expect(storage).toMatchObject({
      key: 'storage',
      type: 'select',
      sortOrder: 0,
    });
  });

  it('keeps a submitted storage and forces its type to select', () => {
    const out = normalizeAttributes([
      {
        key: 'storage',
        label: 'Storage',
        type: 'text',
        options: ['128GB', '256GB'],
        required: true,
      },
    ]);
    const storage = out.find((a) => a.key === 'storage')!;
    expect(storage.type).toBe('select');
    expect(storage.options).toEqual(['128GB', '256GB']);
    expect(out).toHaveLength(1);
  });

  it('slugifies non-conforming keys to camelCase', () => {
    const out = normalizeAttributes([
      { key: 'Battery cycles', label: 'Battery cycles', type: 'number' },
    ]);
    expect(out.map((a) => a.key)).toContain('batteryCycles');
  });

  it('keeps an already-valid camelCase key untouched', () => {
    const out = normalizeAttributes([
      { key: 'batteryCycles', label: 'x', type: 'number' },
    ]);
    expect(out.find((a) => a.key === 'batteryCycles')).toBeDefined();
  });

  it('trims, dedupes and drops empty options', () => {
    const out = normalizeAttributes([
      {
        key: 'ram',
        label: 'RAM',
        type: 'select',
        options: [' 8GB ', '8GB', '', '12GB'],
      },
    ]);
    expect(out.find((a) => a.key === 'ram')!.options).toEqual(['8GB', '12GB']);
  });

  it('clears options for non-select types', () => {
    const out = normalizeAttributes([
      { key: 'note', label: 'Note', type: 'text', options: ['x'] },
    ]);
    expect(out.find((a) => a.key === 'note')!.options).toEqual([]);
  });

  it('defaults sortOrder by position', () => {
    const out = normalizeAttributes([
      { key: 'color', label: 'Color', type: 'select', options: ['A'] },
      { key: 'ram', label: 'RAM', type: 'select', options: ['B'] },
    ]);
    expect(out.find((a) => a.key === 'color')!.sortOrder).toBe(10);
    expect(out.find((a) => a.key === 'ram')!.sortOrder).toBe(20);
  });

  it('throws on duplicate keys after slugify', () => {
    expect(() =>
      normalizeAttributes([
        { key: 'ram', label: 'RAM', type: 'text' },
        { key: 'RAM', label: 'ram', type: 'text' },
      ]),
    ).toThrow(BadRequestException);
  });

  it('throws on an invalid type for a non-storage key', () => {
    expect(() =>
      normalizeAttributes([{ key: 'x', label: 'x', type: 'bogus' }]),
    ).toThrow(BadRequestException);
  });

  it('throws on an unusable key', () => {
    expect(() =>
      normalizeAttributes([{ key: '123', label: '', type: 'text' }]),
    ).toThrow(BadRequestException);
  });

  it('defaultAttributes carries required storage + optional color selects', () => {
    const d = defaultAttributes();
    expect(d.find((a) => a.key === 'storage')).toMatchObject({
      type: 'select',
      required: true,
    });
    expect(d.find((a) => a.key === 'color')).toMatchObject({
      type: 'select',
      required: false,
    });
  });
});

describe('validateSpecs', () => {
  const attrs: AttributeDef[] = [
    {
      key: 'storage',
      label: 'Storage',
      type: 'select',
      options: ['128GB', '256GB'],
      required: true,
      sortOrder: 10,
    },
    {
      key: 'color',
      label: 'Color',
      type: 'text',
      options: [],
      required: false,
      sortOrder: 20,
    },
    {
      key: 'batteryCycles',
      label: 'Battery cycles',
      type: 'number',
      options: [],
      required: false,
      sortOrder: 30,
    },
  ];

  it('accepts anything for a legacy (empty-schema) model', () => {
    expect(validateSpecs([], { whatever: 'yes', n: 5 })).toEqual([]);
  });

  it('passes valid specs', () => {
    expect(
      validateSpecs(attrs, {
        storage: '256GB',
        color: 'Black',
        batteryCycles: 42,
      }),
    ).toEqual([]);
  });

  it('reports a missing required value', () => {
    const problems = validateSpecs(attrs, { color: 'Black' });
    expect(problems).toContainEqual(
      expect.objectContaining({ key: 'storage' }),
    );
  });

  it('reports a select value outside the options', () => {
    const problems = validateSpecs(attrs, { storage: '1TB' });
    expect(problems).toContainEqual(
      expect.objectContaining({ key: 'storage' }),
    );
  });

  it('reports a non-numeric number', () => {
    const problems = validateSpecs(attrs, {
      storage: '128GB',
      batteryCycles: 'abc',
    });
    expect(problems).toContainEqual(
      expect.objectContaining({ key: 'batteryCycles' }),
    );
  });

  it('rejects unknown keys (strict)', () => {
    const problems = validateSpecs(attrs, { storage: '128GB', foo: 'bar' });
    expect(problems).toContainEqual(expect.objectContaining({ key: 'foo' }));
  });

  it('accepts a select with no configured options (unconfigured)', () => {
    const open: AttributeDef[] = [
      {
        key: 'storage',
        label: 'Storage',
        type: 'select',
        options: [],
        required: false,
        sortOrder: 0,
      },
    ];
    expect(validateSpecs(open, { storage: 'anything' })).toEqual([]);
  });
});
