import { registerDecorator, ValidationOptions } from 'class-validator';

const KEY_RE = /^[a-zA-Z0-9_]{1,40}$/;
const MAX_KEYS = 50;
const MAX_STRING = 200;

/**
 * Open-ended device `specs` (JSONB) must stay a flat, bounded map so it cannot
 * carry nested payloads or unbounded blobs. Rules: a plain object of at most
 * {@link MAX_KEYS} keys matching `^[a-zA-Z0-9_]{1,40}$`, whose values are
 * `string` (≤200 chars) | `number` | `boolean` | `null`.
 */
export function isSpecsObject(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_KEYS) return false;
  for (const [key, v] of entries) {
    if (!KEY_RE.test(key)) return false;
    if (v === null) continue;
    const t = typeof v;
    if (t === 'string') {
      if ((v as string).length > MAX_STRING) return false;
      continue;
    }
    if (t !== 'number' && t !== 'boolean') return false;
  }
  return true;
}

/** class-validator decorator wrapping {@link isSpecsObject}. */
export function IsSpecsObject(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) =>
    registerDecorator({
      name: 'isSpecsObject',
      target: target.constructor,
      propertyName: propertyName as string,
      options,
      validator: {
        validate: (value) => isSpecsObject(value),
        defaultMessage: () =>
          `specs must be a flat object of ≤${MAX_KEYS} keys (matching ^[a-zA-Z0-9_]{1,40}$) with string(≤${MAX_STRING})|number|boolean|null values`,
      },
    });
}
