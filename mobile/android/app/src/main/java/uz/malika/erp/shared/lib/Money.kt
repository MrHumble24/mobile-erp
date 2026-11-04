package uz.malika.erp.shared.lib

import java.math.BigDecimal
import java.text.NumberFormat
import java.util.Locale

/**
 * Money helpers. The server serializes `Decimal` as strings; parse defensively
 * with [BigDecimal] (never a float) and format for display. One source for both.
 */
fun parseMoney(value: String?): BigDecimal = value?.trim()?.toBigDecimalOrNull() ?: BigDecimal.ZERO

private val CENT_THRESHOLD = BigDecimal("0.005")

/** Group-formatted USD amount, e.g. `$1,250`, `$1,250.50` or `-$133.33` (sign before the symbol, as on iOS/web). */
fun formatMoney(value: String?, suffix: String? = null): String {
    val amount = parseMoney(value)
    val hasCents = amount.remainder(BigDecimal.ONE).abs() >= CENT_THRESHOLD
    val nf = NumberFormat.getNumberInstance(Locale.US).apply {
        minimumFractionDigits = if (hasCents) 2 else 0
        maximumFractionDigits = if (hasCents) 2 else 0
    }
    val sign = if (amount.signum() < 0) "-" else ""
    val formatted = sign + "$" + nf.format(amount.abs())
    return if (!suffix.isNullOrEmpty()) "$formatted $suffix" else formatted
}
