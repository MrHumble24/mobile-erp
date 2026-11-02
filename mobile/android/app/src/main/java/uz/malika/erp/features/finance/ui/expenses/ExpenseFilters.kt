package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.ExpenseFilter
import uz.malika.erp.features.finance.data.ExpenseSort
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.DateRange

/**
 * Expenses list filters mirroring the web page: search, category, recurring,
 * amount bounds, sort and a date range ([AppDateRangeField]). Text/amount
 * changes are debounced in the ViewModel; the rest refetch immediately.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExpenseFilters(
    categories: List<ExpenseCategory>,
    filter: ExpenseFilter,
    onCategory: (String?) -> Unit,
    onRecurring: (Boolean?) -> Unit,
    onSearch: (String) -> Unit,
    onAmount: (Double?, Double?) -> Unit,
    onSort: (ExpenseSort) -> Unit,
    onRange: (String?, String?) -> Unit,
) {
    val t = LocalT.current
    var search by remember { mutableStateOf("") }
    var min by remember { mutableStateOf("") }
    var max by remember { mutableStateOf("") }
    var range by remember { mutableStateOf(DateRange()) }

    fun pushAmount() = onAmount(min.toDoubleOrNull(), max.toDoubleOrNull())

    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        AppFormField(
            label = t("common.search", null),
            value = search,
            onValueChange = { search = it; onSearch(it) },
            placeholder = t("expenses.searchPlaceholder", null),
        )
        FlowRow(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            AppSelectField(
                label = t("expenses.category", null),
                options = buildList {
                    add(SelectOption<String?>(null, t("common.all", null)))
                    categories.forEach { add(SelectOption(it.id, it.name)) }
                },
                selected = filter.categoryId,
                onSelect = onCategory,
                modifier = Modifier.width(200.dp),
            )
            AppSelectField(
                label = t("expenses.filterRecurring", null),
                options = listOf(
                    SelectOption<Boolean?>(null, t("common.all", null)),
                    SelectOption(true, t("common.yes", null)),
                    SelectOption(false, t("common.no", null)),
                ),
                selected = filter.isRecurring,
                onSelect = onRecurring,
                modifier = Modifier.width(200.dp),
            )
            AppSelectField(
                label = t("expenses.sortLabel", null),
                options = listOf(
                    SelectOption(ExpenseSort.NEWEST, t("expenses.sortNewest", null)),
                    SelectOption(ExpenseSort.OLDEST, t("expenses.sortOldest", null)),
                    SelectOption(ExpenseSort.AMOUNT_DESC, t("expenses.sortAmountDesc", null)),
                    SelectOption(ExpenseSort.AMOUNT_ASC, t("expenses.sortAmountAsc", null)),
                ),
                selected = filter.sort,
                onSelect = onSort,
                modifier = Modifier.width(200.dp),
            )
            AppFormField(
                label = t("expenses.minAmount", null),
                value = min,
                onValueChange = { min = it; pushAmount() },
                keyboardType = KeyboardType.Decimal,
                modifier = Modifier.width(150.dp),
            )
            AppFormField(
                label = t("expenses.maxAmount", null),
                value = max,
                onValueChange = { max = it; pushAmount() },
                keyboardType = KeyboardType.Decimal,
                modifier = Modifier.width(150.dp),
            )
            AppDateRangeField(
                label = t("reports.period", null),
                range = range,
                onPick = {
                    range = it
                    onRange(isoDate(it.startMillis), isoDate(it.endMillis))
                },
                modifier = Modifier.width(260.dp),
            )
        }
    }
}
