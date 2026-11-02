package uz.malika.erp.features.sales.lib

/**
 * Whole days of warranty cover left, floored at 0. A partial remaining day
 * counts as 1 (ceil) so a customer returning on the last day is still covered —
 * mirrors the server `remainingWarrantyDays`. Used for the offline warranty
 * lookup, where the server's computed value is not available.
 */
fun remainingWarrantyDays(endsAtMillis: Long, nowMillis: Long): Int {
    val ms = endsAtMillis - nowMillis
    if (ms <= 0) return 0
    val day = 86_400_000.0
    return Math.ceil(ms / day).toInt()
}
