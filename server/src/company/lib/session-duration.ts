export function parseSessionDurationMinutes(val: string): number | null {
  const match = /^(\d+)([mhd])$/.exec(val.trim());
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (isNaN(num) || num <= 0) return null;
  const unit = match[2];
  if (unit === 'm') return num;
  if (unit === 'h') return num * 60;
  if (unit === 'd') return num * 24 * 60;
  return null;
}

export function isValidSessionDuration(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  const minutes = parseSessionDurationMinutes(val);
  if (minutes === null) return false;
  // Between 5 minutes and 30 days (43,200 minutes)
  return minutes >= 5 && minutes <= 43200;
}
