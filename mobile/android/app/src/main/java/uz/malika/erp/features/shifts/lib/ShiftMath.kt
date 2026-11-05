package uz.malika.erp.features.shifts.lib

import uz.malika.erp.shared.lib.parseMoney
import java.math.BigDecimal

/**
 * The one piece of shift arithmetic the client computes: the live close-out
 * difference preview (ADR 0036). The server owns expected cash; this only shows
 * `counted − expected` before the cashier confirms. Pure — unit-tested.
 */
object ShiftMath {

    /** counted − expected. Positive = surplus (counted more), negative = shortage. */
    fun difference(expected: BigDecimal, counted: BigDecimal): BigDecimal = counted.subtract(expected)

    /** The same from the typed strings the UI holds; blanks parse to zero. */
    fun difference(expected: String, counted: String): BigDecimal =
        difference(parseMoney(expected), parseMoney(counted))

    enum class Sign { NONE, SHORTAGE, SURPLUS }

    fun sign(difference: BigDecimal): Sign = when (difference.signum()) {
        0 -> Sign.NONE
        -1 -> Sign.SHORTAGE
        else -> Sign.SURPLUS
    }
}
