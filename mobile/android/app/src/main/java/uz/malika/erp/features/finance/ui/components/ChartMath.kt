package uz.malika.erp.features.finance.ui.components

import kotlin.math.abs
import kotlin.math.roundToLong

/** One labelled, ranked slice of a breakdown chart (`value` with its 0..1 `share`). */
data class BreakdownDatum(val key: String, val label: String, val value: Double, val share: Double)

/** Sentinel key for the aggregated "others" row produced by [capWithOther]. */
const val OTHER_KEY = "__other__"

/**
 * Keep the top [limit] rows by value and fold the rest into one "others" row
 * (summing value + share), mirroring the web `capWithOther`. Input is assumed
 * ranked desc; a short list is returned unchanged. Pure — unit tested.
 */
fun capWithOther(rows: List<BreakdownDatum>, limit: Int, otherLabel: String): List<BreakdownDatum> {
    if (rows.size <= limit) return rows
    val head = rows.take(limit - 1)
    val tail = rows.drop(limit - 1)
    val other = BreakdownDatum(
        key = OTHER_KEY,
        label = otherLabel,
        value = tail.sumOf { it.value },
        share = tail.sumOf { it.share },
    )
    return head + other
}

/** Compact magnitude label for a value (e.g. 1.2M, 450K) so chart text stays short. */
fun shortNumber(value: Double): String {
    val v = abs(value).roundToLong()
    return when {
        v >= 1_000_000 -> "${(v / 100_000) / 10.0}M"
        v >= 1_000 -> "${(v / 100) / 10.0}K"
        else -> v.toString()
    }
}
