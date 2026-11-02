package uz.malika.erp.features.procurement.lib

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * UTC date helpers using [SimpleDateFormat] (API 1+) rather than `java.time`,
 * which needs core-library desugaring this module does not enable (minSdk 24).
 */
private fun utc(pattern: String) = SimpleDateFormat(pattern, Locale.US).apply {
    timeZone = TimeZone.getTimeZone("UTC")
}

private const val DATE = "yyyy-MM-dd"
private const val INSTANT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"

/** `yyyy-MM-dd` for the given epoch-ms (UTC); defaults to now. */
fun millisToDate(ms: Long = System.currentTimeMillis()): String = utc(DATE).format(Date(ms))

/** Full ISO-8601 instant for the given epoch-ms (UTC). */
fun millisToInstant(ms: Long): String = utc(INSTANT).format(Date(ms))

/** Parse a `yyyy-MM-dd` back to epoch-ms (UTC midnight), or null. */
fun dateToMillis(date: String): Long? = runCatching { utc(DATE).parse(date)?.time }.getOrNull()

/** Epoch-ms for UTC midnight today (QC "today" stats preset). */
fun startOfTodayMillis(): Long {
    val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
    cal.set(Calendar.HOUR_OF_DAY, 0)
    cal.set(Calendar.MINUTE, 0)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    return cal.timeInMillis
}
