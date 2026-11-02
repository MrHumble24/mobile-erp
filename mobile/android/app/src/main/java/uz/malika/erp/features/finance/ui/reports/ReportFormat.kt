package uz.malika.erp.features.finance.ui.reports

import uz.malika.erp.shared.lib.formatMoney
import kotlin.math.roundToLong

/** Format a chart's numeric money value (rounded to whole units, like the web CSV). */
fun moneyOf(value: Double): String = formatMoney(value.roundToLong().toString())
