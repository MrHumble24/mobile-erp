package uz.malika.erp.features.balance.model

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * A picked local day → the UTC instants that bound it, matching finance's
 * `isoRangeFrom`/`isoRangeTo`: the server reads a bare `yyyy-MM-dd` as UTC
 * midnight, so a range must send real instants or "today" collapses to an empty
 * window. Calendar-based for the minSdk-24 floor (no java.time desugaring).
 *
 * ponytail: replicated from finance because slices are isolated; lift to
 * shared/lib if a third copy appears.
 */
private fun isoInstant(d: Date): String =
    SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        .apply { timeZone = TimeZone.getTimeZone("UTC") }
        .format(d)

private fun startOfDay(millis: Long): Date =
    Calendar.getInstance().apply {
        timeInMillis = millis
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.time

/** Range lower bound: local midnight of the picked day, as a UTC instant. */
fun ledgerRangeFrom(millis: Long?): String? = millis?.let { isoInstant(startOfDay(it)) }

/** Range upper bound: local end of the picked day, as a UTC instant (inclusive). */
fun ledgerRangeTo(millis: Long?): String? = millis?.let {
    val end = Calendar.getInstance().apply {
        time = startOfDay(it)
        add(Calendar.DAY_OF_MONTH, 1)
        add(Calendar.MILLISECOND, -1)
    }.time
    isoInstant(end)
}
