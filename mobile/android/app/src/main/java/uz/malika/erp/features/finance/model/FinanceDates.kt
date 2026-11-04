package uz.malika.erp.features.finance.model

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Date helpers for the finance slice (Calendar-based, so they work on the
 * minSdk-24 floor without java.time desugaring). Single-date payloads go out as
 * `yyyy-MM-dd`; a date *range* goes out as UTC instants bounding the local days
 * ([isoRangeFrom] / [isoRangeTo]) — the server's `new Date(value)` reads a bare
 * `yyyy-MM-dd` as UTC midnight, so `from == to == today` would be an empty
 * range and "today" would always show $0. iOS sends the same local-day bounds.
 * The UI shows `dd.MM.yyyy`.
 */
enum class DashPeriod { TODAY, WEEK, MONTH }

private fun calOf(now: Date): Calendar =
    Calendar.getInstance().apply {
        time = now
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }

/** Start instant of [period] relative to [now] (midnight / week-Monday / 1st). */
fun periodStart(period: DashPeriod, now: Date = Date()): Date {
    val cal = calOf(now)
    when (period) {
        DashPeriod.TODAY -> Unit
        DashPeriod.WEEK -> cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
        DashPeriod.MONTH -> cal.set(Calendar.DAY_OF_MONTH, 1)
    }
    return cal.time
}

fun startOfDay(now: Date = Date()): Date = calOf(now).time

fun isoDate(d: Date): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(d)

fun displayDate(d: Date): String = SimpleDateFormat("dd.MM.yyyy", Locale.US).format(d)

/** `yyyy-MM-dd` for an epoch-millis instant (nullable → null). */
fun isoDate(millis: Long?): String? = millis?.let { isoDate(Date(it)) }

/** ISO-8601 UTC instant (`2026-11-04T19:00:00.000Z`) — what `new Date()` parses losslessly. */
fun isoInstant(d: Date): String =
    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        .apply { timeZone = TimeZone.getTimeZone("UTC") }
        .format(d)

/** Local 23:59:59.999 of the day containing [d]. */
fun endOfDay(d: Date): Date =
    calOf(d).apply { add(Calendar.DAY_OF_MONTH, 1); add(Calendar.MILLISECOND, -1) }.time

/** Range query lower bound: local midnight of the picked day, as a UTC instant. */
fun isoRangeFrom(millis: Long?): String? = millis?.let { isoInstant(startOfDay(Date(it))) }

/** Range query upper bound: local end of the picked day, as a UTC instant (inclusive). */
fun isoRangeTo(millis: Long?): String? = millis?.let { isoInstant(endOfDay(Date(it))) }

/**
 * Trend bucket for a date range, matching the web `bucketFor`: ≤31 days → day,
 * ≤180 → week, else month. Null bounds fall back to a day bucket.
 */
fun bucketForRange(fromMillis: Long?, toMillis: Long?): String {
    if (fromMillis == null || toMillis == null) return "day"
    val days = (toMillis - fromMillis) / 86_400_000L + 1
    return when {
        days <= 31 -> "day"
        days <= 180 -> "week"
        else -> "month"
    }
}

/** The default report window: the last 30 days (start/end epoch millis). */
fun defaultReportRangeMillis(now: Date = Date()): Pair<Long, Long> {
    val cal = Calendar.getInstance().apply { time = now }
    val end = cal.timeInMillis
    cal.add(Calendar.DAY_OF_YEAR, -29)
    return cal.timeInMillis to end
}
