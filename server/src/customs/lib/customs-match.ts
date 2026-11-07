/**
 * Normalises a customs code, model name, or storage string:
 * - Upper-case
 * - Collapse multiple spaces into one space
 * - Remove spaces before GB/TB (e.g. "256 GB" -> "256GB", "1 TB" -> "1TB")
 * - Trim outer whitespace
 */
export function normalizeCustomsKey(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\s+(GB|TB)\b/g, '$1');
}

/**
 * The normalised key without a trailing storage token:
 * "iPhone 15 Pro 256 GB" -> "IPHONE 15 PRO". A list row with storage is
 * "used" by a model whose code equals this base.
 */
export function baseCustomsKey(raw: string): string {
  return normalizeCustomsKey(raw).replace(/\s+\d+(GB|TB)$/, '');
}

/**
 * Two-step lookup for customs fees:
 * 1. Try customsCode + " " + storage (if storage is provided)
 * 2. Try customsCode alone
 *
 * Both candidates are matched against normalized keys in `feeByCode`.
 * Returns the fee (number) if found, or 0.
 */
export function matchCustomsFee(
  feeByCode: Map<string, number>,
  customsCode?: string | null,
  storage?: string | null,
): number {
  if (!customsCode || !customsCode.trim()) return 0;

  if (storage && typeof storage === 'string' && storage.trim()) {
    const withStorage = normalizeCustomsKey(`${customsCode} ${storage}`);
    const feeWithStorage = feeByCode.get(withStorage);
    if (feeWithStorage !== undefined) {
      return feeWithStorage;
    }
  }

  const codeOnly = normalizeCustomsKey(customsCode);
  const feeOnly = feeByCode.get(codeOnly);
  return feeOnly ?? 0;
}
