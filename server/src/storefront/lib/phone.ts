/**
 * Checks whether a phone number string is plausible (E.164 compatible).
 * Requires 7 to 15 digits and only standard formatting characters (+, space, -, ()).
 */
export function isPlausiblePhone(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (trimmed.length < 7 || trimmed.length > 30) return false;

  // Only allowed characters
  if (!/^\+?[0-9\s\-()]+$/.test(trimmed)) {
    return false;
  }

  // Count bare digits
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
