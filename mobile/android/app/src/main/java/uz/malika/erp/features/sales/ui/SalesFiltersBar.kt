package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.data.UserOption
import uz.malika.erp.features.sales.model.SalesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppSelect
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.PillButton
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

private const val END_OF_DAY = 86_399_999L

/** Current filter values the bar renders (owned by the ViewModel's SaleFilters). */
data class SalesFilterValues(
    val channel: SaleChannel?,
    val returned: String?,
    val warranty: String?,
    val soldById: String?,
)

/**
 * The sales list filters: search, date range, channel, returned-status, warranty
 * and (admins only) cashier. Each change resets to page 1 via the ViewModel. The
 * cashier select shows only when [canReadUsers]; its options come from the VM.
 */
@Composable
fun SalesFiltersBar(
    vm: SalesViewModel,
    values: SalesFilterValues,
    canReadUsers: Boolean,
    cashiers: List<UserOption>,
) {
    val t = LocalT.current
    var search by remember { mutableStateOf("") }
    var range by remember { mutableStateOf(DateRange()) }

    LaunchedEffect(search) {
        delay(300)
        vm.setSearch(search.trim().takeIf { it.isNotBlank() })
    }

    Column(Modifier.fillMaxWidth()) {
        AppTextField(
            value = search,
            onValueChange = { search = it },
            placeholder = t("sales.filterSearch", null),
            imeAction = ImeAction.Search,
        )
        Spacer(Modifier.height(8.dp))
        AppDateRangeField(
            label = t("reports.period", null),
            range = range,
            onPick = { range = it; vm.setRange(isoFrom(it.startMillis), isoTo(it.endMillis)) },
        )
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth()) {
            AppSelect(
                value = values.channel,
                options = listOf(SaleChannel.RETAIL, SaleChannel.B2B),
                optionLabel = { channelLabel(it, t) },
                onSelect = vm::setChannel,
                label = t("sales.filterChannel", null),
                nullOption = t("common.all", null),
                modifier = Modifier.weight(1f),
            )
            Spacer(Modifier.width(8.dp))
            AppSelect(
                value = values.returned,
                options = listOf("false", "true"),
                optionLabel = { if (it == "true") t("sales.statusReturned", null) else t("sales.statusActive", null) },
                onSelect = vm::setReturned,
                label = t("sales.filterStatus", null),
                nullOption = t("common.all", null),
                modifier = Modifier.weight(1f),
            )
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth()) {
            AppSelect(
                value = values.warranty,
                options = listOf("active", "expired"),
                optionLabel = { if (it == "expired") t("sales.warrantyExpired", null) else t("sales.warrantyValid", null) },
                onSelect = vm::setWarranty,
                label = t("sales.filterWarranty", null),
                nullOption = t("common.all", null),
                modifier = Modifier.weight(1f),
            )
            if (canReadUsers) {
                Spacer(Modifier.width(8.dp))
                AppSelect(
                    value = cashiers.firstOrNull { it.id == values.soldById },
                    options = cashiers,
                    optionLabel = { it.name },
                    onSelect = { vm.setSoldById(it?.id) },
                    label = t("sales.soldBy", null),
                    nullOption = t("common.all", null),
                    modifier = Modifier.weight(1f),
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        PillButton(
            text = t("sales.resetFilters", null),
            onClick = { search = ""; range = DateRange(); vm.clearFilters() },
            variant = ButtonVariant.GHOST,
        )
    }
}

private fun channelLabel(channel: SaleChannel, t: Translate) =
    if (channel == SaleChannel.B2B) t("sales.channelB2B", null) else t("sales.channelRetail", null)

private val isoUtc = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    .apply { timeZone = TimeZone.getTimeZone("UTC") }

private fun isoFrom(millis: Long?): String? = millis?.let { isoUtc.format(it) }
private fun isoTo(millis: Long?): String? = millis?.let { isoUtc.format(it + END_OF_DAY) }
