import { getLocalDateString, getLocalHhMm } from '../../common/time-zone.js';

/**
 * Closing-digest scheduling, kept pure so the once-per-day guard is unit-tested
 * without mocking the clock. closingTime is "HH:mm" in company time zone; the
 * marker (StoreSettings.digestSentOn, a @db.Date) round-trips as UTC midnight of
 * the local day it was saved for.
 */

function hhmmLocal(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** UTC-midnight of `now`'s local calendar day — the value stored in digestSentOn. */
export function todayMarker(now: Date, timeZone?: string): Date {
  if (timeZone) {
    const localDate = getLocalDateString(now, timeZone);
    return new Date(`${localDate}T00:00:00.000Z`);
  }
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function sameLocalDay(marker: Date, now: Date, timeZone?: string): boolean {
  if (timeZone) {
    const markerDate = getLocalDateString(marker, 'UTC');
    const nowDate = getLocalDateString(now, timeZone);
    return markerDate === nowDate;
  }
  return (
    marker.getUTCFullYear() === now.getFullYear() &&
    marker.getUTCMonth() === now.getMonth() &&
    marker.getUTCDate() === now.getDate()
  );
}

/** True when the current minute matches closingTime and no digest went out today. */
export function shouldSendDigest(
  now: Date,
  closingTime: string,
  digestSentOn: Date | null,
  timeZone?: string,
): boolean {
  const currentHhmm = timeZone ? getLocalHhMm(now, timeZone) : hhmmLocal(now);
  if (currentHhmm !== closingTime) return false;
  if (digestSentOn && sameLocalDay(digestSentOn, now, timeZone)) return false;
  return true;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
