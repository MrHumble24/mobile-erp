package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.runtime.Composable
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.ExpenseFilter
import uz.malika.erp.features.finance.data.ExpenseSort
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AdaptiveInputs
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.FilterSheet

/**
 * Expenses filter bottom sheet (iOS parity): category, recurring, sort, amount
 * bounds and date range. Search stays inline on the screen. Every control
 * applies immediately through the ViewModel; the min/max fields share one
 * component so the paired row keeps equal height.
 */
@Composable
fun ExpenseFiltersSheet(
    categories: List<ExpenseCategory>,
    filter: ExpenseFilter,
    min: String,
    max: String,
    range: DateRange,
    onCategory: (String?) -> Unit,
    onRecurring: (Boolean?) -> Unit,
    onSort: (ExpenseSort) -> Unit,
    onMin: (String) -> Unit,
    onMax: (String) -> Unit,
    onRange: (DateRange) -> Unit,
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
        AppSelectField(
            label = t("expenses.category", null),
            options = buildList {
                add(SelectOption<String?>(null, t("common.all", null)))
                categories.forEach { add(SelectOption(it.id, it.name)) }
            },
            selected = filter.categoryId,
            onSelect = onCategory,
        )
        AppSelectField(
            label = t("expenses.filterRecurring", null),
            options = listOf(
                SelectOption<Boolean?>(null, t("common.all", null)),
                SelectOption(true, t("expenses.recurringOnly", null)),
                SelectOption(false, t("expenses.oneOff", null)),
            ),
            selected = filter.isRecurring,
            onSelect = onRecurring,
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
        )
        AdaptiveInputs(
            fields = listOf(
                { m ->
                    AppFormField(
                        label = t("expenses.minAmount", null),
                        value = min,
                        onValueChange = onMin,
                        keyboardType = KeyboardType.Decimal,
                        modifier = m,
                    )
                },
                { m ->
                    AppFormField(
                        label = t("expenses.maxAmount", null),
                        value = max,
                        onValueChange = onMax,
                        keyboardType = KeyboardType.Decimal,
                        modifier = m,
                    )
                },
            ),
        )
        AppDateRangeField(
            label = t("reports.period", null),
            range = range,
            onPick = onRange,
        )
    }
}
