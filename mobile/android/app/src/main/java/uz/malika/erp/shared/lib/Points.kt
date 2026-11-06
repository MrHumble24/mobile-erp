package uz.malika.erp.shared.lib

import java.math.BigDecimal
import java.text.NumberFormat
import java.util.Locale

/**
 * Bonus points as display text: grouped thousands (same separator as
 * [formatMoney]), no currency symbol, a `.00` fraction dropped, other decimals
 * kept. `null` or unparsable input renders `0`.
 */
fun formatPoints(value: String?): String {
    val amount = parseMoney(value)
    val nf = NumberFormat.getNumberInstance(Locale.US).apply {
        minimumFractionDigits = 0
        maximumFractionDigits = 2
        isGroupingUsed = true
    }
    val sign = if (amount.signum() < 0) "-" else ""
    return sign + nf.format(amount.abs())
}
