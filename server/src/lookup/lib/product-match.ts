import type { AttributeDef } from '../../device-models/lib/attribute-schema.js';

/** lower-case, remove all whitespace. */
function squash(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

/**
 * A comparison key for "same product by brand + model", ignoring case, spacing
 * and a leading brand word in the model: `Apple` + `iPhone 11` and
 * `Apple` + `Apple iPhone 11` both key to `appleiphone11`. Used to match a
 * reference brand/model against our catalog when no code or link does.
 */
export function modelMatchKey(brand: string, model: string): string {
  const b = squash(brand);
  let m = squash(model);
  if (b && m.startsWith(b)) m = m.slice(b.length);
  return b + m;
}

/** Stable identity of a reference brand/model pair, for the learned-link key. */
export function linkKey(brand: string, model: string): string {
  return `${squash(brand)}|${squash(model)}`;
}

/**
 * The product's own option for a reference attribute value, compared ignoring
 * case and spaces (`256GB` matches `256gb`). Returns null when the product has
 * no such attribute, the reference gives no value, or no option matches.
 */
export function matchAttributeOption(
  attributes: AttributeDef[],
  key: string,
  refValue: string | null | undefined,
): string | null {
  if (!refValue) return null;
  const attr = attributes.find((a) => a.key === key);
  if (!attr?.options?.length) return null;
  const target = squash(refValue);
  return attr.options.find((opt) => squash(opt) === target) ?? null;
}
