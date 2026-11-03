package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.ExpenseFilter
import uz.malika.erp.features.finance.data.ExpenseSort
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppDateRangeField
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.PillButton

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
    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(t("common.filter", null), style = MaterialTheme.typography.headlineSmall)
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
                    SelectOption(true, t("common.yes", null)),
                    SelectOption(false, t("common.no", null)),
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
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AppFormField(
                    label = t("expenses.minAmount", null),
                    value = min,
                    onValueChange = onMin,
                    keyboardType = KeyboardType.Decimal,
                    modifier = Modifier.weight(1f),
                )
                AppFormField(
                    label = t("expenses.maxAmount", null),
                    value = max,
                    onValueChange = onMax,
                    keyboardType = KeyboardType.Decimal,
                    modifier = Modifier.weight(1f),
                )
            }
            AppDateRangeField(
                label = t("reports.period", null),
                range = range,
                onPick = onRange,
            )
            Spacer(Modifier.height(4.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.End)) {
                if (canReset) {
                    PillButton(t("expenses.resetFilters", null), onClick = onReset, variant = ButtonVariant.GHOST)
                }
                PillButton(t("common.close", null), onClick = onDismiss)
            }
        }
    }
}
