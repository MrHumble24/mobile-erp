package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.core.nowIso
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.model.SalesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import java.util.Calendar

private const val MS_PER_DAY = 86_400_000L

/**
 * Channel + date-range filters for the sales list. The range uses lazy presets
 * (all / last 7 / last 30 days) instead of a full calendar picker.
 *
 * ponytail: presets over a calendar range picker. Add a DateRangePicker only if
 * a specific historical window is needed.
 */
@Composable
fun SalesFiltersBar(vm: SalesViewModel, channel: SaleChannel?, rangeDays: Int, onRangeDays: (Int) -> Unit) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth()) {
        SegmentedControl(
            options = listOf(
                SegmentOption<String>("all", t("common.all", null)),
                SegmentOption("retail", t("sales.channelRetail", null)),
                SegmentOption("b2b", t("sales.channelB2B", null)),
            ),
            selected = when (channel) {
                SaleChannel.RETAIL -> "retail"
                SaleChannel.B2B -> "b2b"
                null -> "all"
            },
            onSelect = {
                vm.setChannel(
                    when (it) {
                        "retail" -> SaleChannel.RETAIL
                        "b2b" -> SaleChannel.B2B
                        else -> null
                    },
                )
            },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        SegmentedControl(
            options = listOf(
                SegmentOption<Int>(0, t("common.all", null)),
                SegmentOption(7, t("sales.daysShort", mapOf("count" to 7))),
                SegmentOption(30, t("sales.daysShort", mapOf("count" to 30))),
            ),
            selected = rangeDays,
            onSelect = { days ->
                onRangeDays(days)
                if (days == 0) {
                    vm.setRange(null, null)
                } else {
                    vm.setRange(isoDaysAgo(days), nowIso())
                }
            },
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

private fun isoDaysAgo(days: Int): String {
    val cal = Calendar.getInstance()
    cal.timeInMillis = System.currentTimeMillis() - days * MS_PER_DAY
    return java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
        .apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
        .format(cal.time)
}
