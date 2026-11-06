export function isValidTimeZone(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  try {
    const supported = Intl.supportedValuesOf('timeZone');
    return supported.includes(val.trim());
  } catch {
    return false;
  }
}
