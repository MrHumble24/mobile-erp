package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.ExpenseFilter
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.i18n.LocalT

/** Category + recurring filters driving the expenses list query. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExpenseFilters(
    categories: List<ExpenseCategory>,
    filter: ExpenseFilter,
    onCategory: (String?) -> Unit,
    onRecurring: (Boolean?) -> Unit,
) {
    val t = LocalT.current
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
            modifier = Modifier.width(210.dp),
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
            modifier = Modifier.width(210.dp),
        )
    }
}
