package uz.malika.erp.core

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

/**
 * The one id generator — use it for outbox mutation ids and the terminal id so
 * nothing reinvents one. [UUID.randomUUID] is RFC-4122 v4 (cryptographically
 * seeded on Android), so no extra dependency is needed.
 */
fun newUuidV4(): String = UUID.randomUUID().toString()

private val isoFormat: ThreadLocal<SimpleDateFormat> = object : ThreadLocal<SimpleDateFormat>() {
    override fun initialValue(): SimpleDateFormat =
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            .apply { timeZone = TimeZone.getTimeZone("UTC") }
}

/** Current instant as an ISO-8601 UTC string (the shape the server expects). */
fun nowIso(): String = isoFormat.get()!!.format(Date())
