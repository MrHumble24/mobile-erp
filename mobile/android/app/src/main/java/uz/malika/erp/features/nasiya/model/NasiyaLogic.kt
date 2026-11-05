package uz.malika.erp.features.nasiya.model

import uz.malika.erp.features.nasiya.data.code

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import uz.malika.erp.features.nasiya.data.ConsignmentViewDto
import uz.malika.erp.features.nasiya.data.money

/**
 * Pure, JVM-testable helpers shared by the Nasiya screens: overdue-day maths,
 * IMEI validation, and credit-bar ratio. No Android/Compose types, so they run
 * under `testDebugUnitTest` (see NasiyaLogicTest). Mirrors the web
 * `consignments/lib/overdue.ts` and the server IMEI rule.
 */
private const val DAY_MS = 86_400_000L

private val dayFormat = object : ThreadLocal<SimpleDateFormat>() {
    override fun initialValue() =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
}

/** Epoch millis of the date portion of an ISO string, or null if unparseable. */
fun isoDateMillis(iso: String?): Long? {
    val head = iso?.take(10) ?: return null
    return runCatching { dayFormat.get()!!.parse(head)?.time }.getOrNull()
}

/** Whole days an OUT consignment is past due; 0 for resolved or not-yet-due. */
fun daysOverdue(dueDateIso: String, statusCode: String, now: Long = System.currentTimeMillis()): Int {
    if (statusCode != "OUT") return 0
    val due = isoDateMillis(dueDateIso) ?: return 0
    val diff = now - due
    return if (diff > 0) (diff / DAY_MS).toInt() else 0
}

/** The device-IMEI rule shared with the server: exactly 15 digits. */
fun isValidImei(imei: String): Boolean = imei.matches(Regex("^\\d{15}$"))

/** A valid unit identifier: a 15-digit IMEI or a 3-64 char serial number (ADR 0029). */
fun isValidUnitCode(code: String): Boolean =
    isValidImei(code) || uz.malika.erp.shared.lib.UnitCode.isValidSerial(code)

/**
 * Credit-bar fill as a 0..1 fraction, or null for "no limit" (limit <= 0).
 * `outstanding`/`creditLimit` are Decimal strings.
 */
fun creditUsedFraction(creditLimit: String, outstanding: String): Float? {
    val limit = creditLimit.toDoubleOrNull() ?: 0.0
    if (limit <= 0.0) return null
    val used = outstanding.toDoubleOrNull() ?: 0.0
    return (used / limit).coerceIn(0.0, 1.0).toFloat()
}

/** ISO date → display `yyyy-MM-dd` (the mobile list keeps dates compact). */
fun displayDate(iso: String?): String = iso?.take(10) ?: "—"

/** Epoch millis → UTC `yyyy-MM-dd`, the day the date-range picker selected. */
fun isoDayUtc(millis: Long): String = dayFormat.get()!!.format(Date(millis))

/**
 * Current consignments page → CSV rows (no cost fields), mirroring the web
 * export: partner, IMEI, agreed price, due date, status, days overdue. Headers
 * are supplied by the caller (i18n), so this stays pure/testable.
 */
fun consignmentCsvRows(
    items: List<ConsignmentViewDto>,
    now: Long = System.currentTimeMillis(),
): List<List<String>> = items.map { c ->
    listOf(
        c.partnerShopName,
        c.code,
        c.agreedPrice.money(),
        displayDate(c.dueDate),
        c.statusCode,
        daysOverdue(c.dueDate, c.statusCode, now).toString(),
    )
}
