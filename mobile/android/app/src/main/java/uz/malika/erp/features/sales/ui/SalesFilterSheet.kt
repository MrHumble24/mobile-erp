package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.data.UserOption
import uz.malika.erp.features.sales.model.SalesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterSheet
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

private const val END_OF_DAY = 86_399_999L

/** Current sheet filter values (owned by the ViewModel's SaleFilters). */
data class SalesFilterValues(
    val channel: SaleChannel?,
    val returned: String?,
    val warranty: String?,
    val soldById: String?,
)

/**
 * Sales list filters in a bottom sheet: channel, returned-status, warranty,
 * (admins only) cashier and date range. Search stays inline on the screen.
 * Every control applies immediately through the ViewModel (each setter resets to
 * page 1). The cashier select shows only when [canReadUsers].
 */
@Composable
fun SalesFilterSheet(
    vm: SalesViewModel,
    values: SalesFilterValues,
    canReadUsers: Boolean,
    cashiers: List<UserOption>,
    range: DateRange,
    onRangeChange: (DateRange) -> Unit,
    canReset: Boolean,
    onReset: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    FilterSheet(
        title = t("common.filter", null),
        onDismiss = onDismiss,
        canReset = canReset,
        onReset = onReset,
    ) {
        AppSelect(
            value = values.channel,
            options = listOf(SaleChannel.RETAIL, SaleChannel.B2B),
            optionLabel = { channelLabel(it, t) },
            onSelect = vm::setChannel,
            label = t("sales.filterChannel", null),
            nullOption = t("common.all", null),
            modifier = Modifier.fillMaxWidth(),
        )
        AppSelect(
            value = values.returned,
            options = listOf("false", "true"),
            optionLabel = { if (it == "true") t("sales.statusReturned", null) else t("sales.statusActive", null) },
            onSelect = vm::setReturned,
            label = t("sales.filterStatus", null),
            nullOption = t("common.all", null),
            modifier = Modifier.fillMaxWidth(),
        )
        AppSelect(
            value = values.warranty,
            options = listOf("active", "expired"),
            optionLabel = { if (it == "expired") t("sales.warrantyExpired", null) else t("sales.warrantyValid", null) },
            onSelect = vm::setWarranty,
            label = t("sales.filterWarranty", null),
            nullOption = t("common.all", null),
            modifier = Modifier.fillMaxWidth(),
        )
        if (canReadUsers) {
            AppSelect(
                value = cashiers.firstOrNull { it.id == values.soldById },
                options = cashiers,
                optionLabel = { it.name },
                onSelect = { vm.setSoldById(it?.id) },
                label = t("sales.soldBy", null),
                nullOption = t("common.all", null),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        AppDateRangeField(
            label = t("reports.period", null),
            range = range,
            onPick = { onRangeChange(it); vm.setRange(isoFrom(it.startMillis), isoTo(it.endMillis)) },
        )
    }
}

private fun channelLabel(channel: SaleChannel, t: Translate) =
    if (channel == SaleChannel.B2B) t("sales.channelB2B", null) else t("sales.channelRetail", null)

private val isoUtc = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    .apply { timeZone = TimeZone.getTimeZone("UTC") }

private fun isoFrom(millis: Long?): String? = millis?.let { isoUtc.format(it) }
private fun isoTo(millis: Long?): String? = millis?.let { isoUtc.format(it + END_OF_DAY) }
