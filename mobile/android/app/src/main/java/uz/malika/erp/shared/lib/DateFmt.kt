package uz.malika.erp.shared.lib

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Display + parse helpers for the ISO-8601 timestamps the server returns
 * (shared by sales and inventory — promoted from features/sales/lib).
 * `SimpleDateFormat` (not java.time) because minSdk 24 ships no desugaring.
 * Display is in device-local time; parsing treats the wire value as UTC.
 */
private const val DASH = "—"

private fun utc(pattern: String) =
    SimpleDateFormat(pattern, Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }

private val localDateTime = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US)

/** Epoch millis for an ISO string, tolerant of a trailing `Z`/offset/millis. */
fun parseIsoMillis(iso: String?): Long? {
    if (iso.isNullOrBlank()) return null
    val core = iso.trim().take(19) // yyyy-MM-ddTHH:mm:ss
    runCatching { utc("yyyy-MM-dd'T'HH:mm:ss").parse(core)?.time }.getOrNull()?.let { return it }
    return runCatching { utc("yyyy-MM-dd").parse(iso.trim().take(10))?.time }.getOrNull()
}

/** `yyyy-MM-dd`, or an em dash when absent. */
fun formatDate(iso: String?): String = iso?.takeIf { it.isNotBlank() }?.take(10) ?: DASH

/** `yyyy-MM-dd HH:mm` in local time, or an em dash when unparseable. */
fun formatDateTime(iso: String?): String {
    val millis = parseIsoMillis(iso) ?: return iso?.take(16)?.replace('T', ' ') ?: DASH
    return localDateTime.format(Date(millis))
}

fun formatDateTime(millis: Long?): String = millis?.let { localDateTime.format(Date(it)) } ?: DASH
