import { BadRequestException } from '@nestjs/common';

export type AttributeType = 'text' | 'number' | 'select';

/** One spec field defined on a device model. */
export interface AttributeDef {
  key: string;
  label: string;
  type: AttributeType;
  options: string[];
  required: boolean;
  sortOrder: number;
}

/** A single validation failure of a device's specs against the model schema. */
export interface SpecProblem {
  key: string;
  message: string;
}

/** Loose, pre-normalization shape (DTO or stored JSON). */
export interface AttributeDefInput {
  key?: string;
  label?: string;
  type?: string;
  options?: unknown;
  required?: boolean;
  sortOrder?: number;
}

/**
 * Reserved key. Reports and stock-alert rules group on `specs->>'storage'`, so
 * every model must carry a `storage` select; its type can never change.
 */
export const RESERVED_STORAGE_KEY = 'storage';

const KEY_RE = /^[a-z][a-zA-Z0-9]*$/;
const TYPES: AttributeType[] = ['text', 'number', 'select'];

/** Scaffold for a brand-new model created without an explicit schema. */
export function defaultAttributes(): AttributeDef[] {
  return [
    {
      key: 'storage',
      label: 'Storage',
      type: 'select',
      options: [],
      required: true,
      sortOrder: 10,
    },
    {
      key: 'color',
      label: 'Color',
      type: 'select',
      options: [],
      required: false,
      sortOrder: 20,
    },
  ];
}

function slugifyKey(raw: string): string {
  const words = raw
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  const [first, ...rest] = words;
  const camel =
    first.toLowerCase() +
    rest.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
  return camel.replace(/^[^a-z]+/, '');
}

function resolveKey(input: AttributeDefInput): string {
  const raw = input.key ?? '';
  const key = KEY_RE.test(raw) ? raw : slugifyKey(raw || input.label || '');
  if (!key) {
    throw new BadRequestException(
      `Attribute "${input.label ?? ''}" has no usable key`,
    );
  }
  return key;
}

function resolveType(key: string, type: unknown): AttributeType {
  // The reserved storage key is always a select; refuse to change its type.
  if (key === RESERVED_STORAGE_KEY) return 'select';
  if (TYPES.includes(type as AttributeType)) return type as AttributeType;
  throw new BadRequestException(
    `Attribute "${key}" has invalid type "${String(type)}"`,
  );
}

function cleanOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of options) {
    const value = String(raw).trim();
    if (value && !seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

function injectStorage(attrs: AttributeDef[]): AttributeDef[] {
  if (attrs.some((a) => a.key === RESERVED_STORAGE_KEY)) return attrs;
  return [
    {
      key: 'storage',
      label: 'Storage',
      type: 'select',
      options: [],
      required: false,
      sortOrder: 0,
    },
    ...attrs,
  ];
}

/**
 * Cleans a submitted/stored attribute list: keys slugified to `[a-z][a-zA-Z0-9]*`
 * and unique, options trimmed/deduped/non-empty, sortOrder defaulted, and the
 * reserved `storage` select injected if absent. Throws `BadRequestException` on
 * duplicate keys or an unusable key/type.
 */
export function normalizeAttributes(
  input: AttributeDefInput[],
): AttributeDef[] {
  const seen = new Set<string>();
  const out = input.map((raw, i) => {
    const key = resolveKey(raw);
    if (seen.has(key)) {
      throw new BadRequestException(`Duplicate attribute key "${key}"`);
    }
    seen.add(key);
    const type = resolveType(key, raw.type);
    return {
      key,
      label: (raw.label ?? key).trim() || key,
      type,
      options: type === 'select' ? cleanOptions(raw.options) : [],
      required: Boolean(raw.required),
      sortOrder: Number.isFinite(raw.sortOrder)
        ? Number(raw.sortOrder)
        : (i + 1) * 10,
    } satisfies AttributeDef;
  });
  return injectStorage(out);
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value) ?? '';
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || toText(value).trim() === '';
}

/**
 * Validates a device's specs against its model schema. Returns the list of
 * problems (empty = valid). Unknown keys are rejected (strict) unless the model
 * has no attributes (legacy model → accept anything).
 */
export function validateSpecs(
  attributes: AttributeDef[],
  specs: Record<string, unknown>,
): SpecProblem[] {
  if (attributes.length === 0) return [];
  const byKey = new Map(attributes.map((a) => [a.key, a]));
  const problems: SpecProblem[] = [];

  for (const key of Object.keys(specs)) {
    if (!byKey.has(key)) {
      problems.push({ key, message: `Unknown attribute "${key}"` });
    }
  }

  for (const attr of attributes) {
    const value = specs[attr.key];
    if (isEmpty(value)) {
      if (attr.required) {
        problems.push({ key: attr.key, message: `${attr.label} is required` });
      }
      continue;
    }
    if (
      attr.type === 'select' &&
      attr.options.length > 0 &&
      !attr.options.includes(toText(value))
    ) {
      problems.push({
        key: attr.key,
        message: `${attr.label} must be one of: ${attr.options.join(', ')}`,
      });
    }
    if (attr.type === 'number' && Number.isNaN(Number(value))) {
      problems.push({
        key: attr.key,
        message: `${attr.label} must be a number`,
      });
    }
  }

  return problems;
}
