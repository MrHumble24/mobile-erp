package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.UpdateCategoryBody
import uz.malika.erp.features.finance.model.ExpensesViewModel
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.ui.theme.Tokens

/**
 * Edit a category: name, description, sort order, and active state. Turning a
 * category in use inactive requires picking a [others] target to reassign its
 * expenses to; a server 409 surfaces that requirement inline.
 */
@Composable
fun EditCategorySheet(
    vm: ExpensesViewModel,
    category: ExpenseCategory,
    others: List<ExpenseCategory>,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    var name by remember { mutableStateOf(category.name) }
    var description by remember { mutableStateOf(category.description ?: "") }
    var sortOrder by remember { mutableStateOf(category.sortOrder.toString()) }
    var active by remember { mutableStateOf(category.isActive) }
    var reassignTo by remember { mutableStateOf<String?>(null) }
    var reassignError by remember { mutableStateOf(false) }

    fun submit() {
        val body = UpdateCategoryBody(
            name = name.trim().ifBlank { null },
            description = description.trim().ifBlank { null },
            sortOrder = sortOrder.trim().toIntOrNull(),
            isActive = active,
            reassignToId = if (!active) reassignTo else null,
        )
        vm.updateCategory(category.id, body, onConflict = { reassignError = true }, onSuccess = onDismiss)
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(t("expenses.editCategory", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            AppFormField(label = t("expenses.categoryName", null), value = name, onValueChange = { name = it })
            AppFormField(label = t("expenses.description", null), value = description, onValueChange = { description = it })
            AppFormField(
                label = t("expenses.sortOrder", null),
                value = sortOrder,
                onValueChange = { sortOrder = it },
                keyboardType = KeyboardType.Number,
            )
            Row(Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch), verticalAlignment = Alignment.CenterVertically) {
                Text(t("expenses.categoryActive", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                Spacer(Modifier.weight(1f))
                AppSwitch(checked = active, onCheckedChange = { active = it; if (it) reassignError = false })
            }
            if (!active) {
                AppSelectField(
                    label = t("expenses.reassignTo", null),
                    options = others.map { SelectOption<String?>(it.id, it.name) },
                    selected = reassignTo,
                    onSelect = { reassignTo = it; reassignError = false },
                )
                if (reassignError) {
                    Text(t("expenses.reassignRequired", null), style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
                }
            }
            PillButton(t("common.save", null), onClick = ::submit, modifier = Modifier.fillMaxWidth())
        }
    }
}
