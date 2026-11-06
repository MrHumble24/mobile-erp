/** Pure schedule math for the once-a-day backup cron. */

/** Midnight (local) of `now`, as a date-only value for `lastRunOn`. */
export function todayDateOnly(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Due when enabled, the local time has reached scheduleTime, and it has not
 * already run today. */
export function isScheduleDue(
  now: Date,
  scheduleTime: string,
  lastRunOn: Date | null,
): boolean {
  const p = (n: number) => String(n).padStart(2, '0');
  const nowHm = `${p(now.getHours())}:${p(now.getMinutes())}`;
  if (nowHm < scheduleTime) return false;
  if (lastRunOn && sameDay(new Date(lastRunOn), now)) return false;
  return true;
}
