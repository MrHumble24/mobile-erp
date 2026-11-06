/**
 * Time zone utilities for computing calendar-day boundaries and clock times
 * according to the company's configured IANA time zone (e.g. 'Asia/Tashkent').
 */

export function getLocalDateString(
  date: Date,
  timeZone = 'Asia/Tashkent',
): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

export function getLocalHhMm(date: Date, timeZone = 'Asia/Tashkent'): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  let h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  if (h === '24') h = '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

export function startOfLocalDay(
  dateOrString?: Date | string,
  timeZone = 'Asia/Tashkent',
): Date {
  const d = dateOrString
    ? typeof dateOrString === 'string' && !dateOrString.includes('T')
      ? new Date(`${dateOrString}T12:00:00Z`)
      : new Date(dateOrString)
    : new Date();

  const dateStr = getLocalDateString(d, timeZone);
  const isoUtcGuess = new Date(`${dateStr}T00:00:00Z`);

  const invFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const testParts = invFormatter.formatToParts(isoUtcGuess);
  let th = parseInt(testParts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  if (th === 24) th = 0;
  const tm = parseInt(
    testParts.find((p) => p.type === 'minute')?.value ?? '0',
    10,
  );

  const offsetMinutes = (th % 24) * 60 + tm;
  return new Date(isoUtcGuess.getTime() - offsetMinutes * 60_000);
}
