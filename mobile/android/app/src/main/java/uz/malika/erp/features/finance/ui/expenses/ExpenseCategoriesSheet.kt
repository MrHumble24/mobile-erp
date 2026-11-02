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
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.model.ExpensesViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/**
 * Manage expense categories: list existing (with an inactive chip), add a new
 * one, and edit / deactivate / reassign each (all online-only, `canManage` =
 * `expense.category.manage`).
 */
@Composable
fun ExpenseCategoriesSheet(
    vm: ExpensesViewModel,
    categories: List<ExpenseCategory>,
    canManage: Boolean,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    var name by remember { mutableStateOf("") }
    var editing by remember { mutableStateOf<ExpenseCategory?>(null) }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(t("expenses.categories", null), style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(4.dp))
            categories.forEach { category ->
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(category.name, style = MaterialTheme.typography.bodyLarge)
                            if (!category.isActive) {
                                StatusChip(t("common.no", null), color = Tokens.slate)
                            }
                        }
                        if (!category.description.isNullOrBlank()) {
                            Text(category.description, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
                        }
                    }
                    if (canManage) {
                        PillButton(t("common.edit", null), onClick = { editing = category }, variant = ButtonVariant.GHOST)
                    }
                }
                HorizontalDivider(color = Tokens.border)
            }
            if (canManage) {
                Spacer(Modifier.height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Bottom) {
                    AppFormField(
                        label = t("expenses.newCategory", null),
                        value = name,
                        onValueChange = { name = it },
                        modifier = Modifier.weight(1f),
                    )
                    PillButton(t("common.add", null), onClick = { if (name.isNotBlank()) vm.addCategory(name.trim()) { name = "" } })
                }
            }
            Spacer(Modifier.height(8.dp))
            PillButton(t("common.close", null), onClick = onDismiss, variant = ButtonVariant.GHOST, modifier = Modifier.fillMaxWidth())
        }
    }

    editing?.let { category ->
        EditCategorySheet(
            vm = vm,
            category = category,
            others = categories.filter { it.isActive && it.id != category.id },
            onDismiss = { editing = null },
        )
    }
}
