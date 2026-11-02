/**
 * Normalizes an Uzbekistan phone number to canonical `+998XXXXXXXXX` form.
 * Accepts spaced/dashed input, a leading `998`, or the bare 9 national digits.
 * Returns `undefined` for empty input and the trimmed original when it cannot
 * be recognized (storage stays lenient; uniqueness is enforced by the schema).
 */
export function normalizeUzPhone(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  let national = trimmed.replace(/\D/g, '');
  if (national.startsWith('998')) national = national.slice(3);
  if (national.length === 9) return `+998${national}`;

  return trimmed;
}
