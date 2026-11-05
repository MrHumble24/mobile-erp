package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
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
import uz.malika.erp.AppContainer
import uz.malika.erp.features.finance.data.CreateExpenseBody
import uz.malika.erp.features.finance.data.Expense
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.model.ExpensesViewModel
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.ui.components.AppSelectField
import uz.malika.erp.features.finance.ui.components.DateField
import uz.malika.erp.features.finance.ui.components.SelectOption
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.payments.PaymentSplit
import uz.malika.erp.shared.payments.ui.AccountPicker
import uz.malika.erp.shared.payments.ui.rememberAccountOptions
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.AppSwitch
import uz.malika.erp.ui.theme.Tokens
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private fun parseIsoDay(iso: String?): Date =
    iso?.take(10)?.let { runCatching { SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(it) }.getOrNull() } ?: Date()

/**
 * Online-only expense form — create or, when [editing] is set, edit. The
 * ViewModel refuses the write when offline (expenses are not in the outbox) and
 * closes the sheet on success.
 */
@Composable
fun LogExpenseSheet(
    container: AppContainer,
    vm: ExpensesViewModel,
    categories: List<ExpenseCategory>,
    editing: Expense?,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    var categoryId by remember { mutableStateOf(editing?.categoryId) }
    var amount by remember { mutableStateOf(editing?.amount?.takeIf { it != "0" } ?: "") }
    var description by remember { mutableStateOf(editing?.description ?: "") }
    var vendor by remember { mutableStateOf(editing?.vendor ?: "") }
    var recurring by remember { mutableStateOf(editing?.isRecurring ?: false) }
    var incurredAt by remember { mutableStateOf(parseIsoDay(editing?.incurredAt)) }
    var account by remember { mutableStateOf(editing?.accountCode ?: PaymentSplit.CASH) }
    var amountError by remember { mutableStateOf<String?>(null) }
    var categoryError by remember { mutableStateOf(false) }
    val accounts by rememberAccountOptions(container)

    fun submit() {
        val amt = amount.trim().toDoubleOrNull()
        categoryError = categoryId == null
        amountError = if (amt == null || amt <= 0) t("expenses.amountPositive", null) else null
        if (categoryError || amountError != null) return
        val body = CreateExpenseBody(
            categoryId = categoryId!!,
            amount = amt!!,
            description = description.trim().ifBlank { null },
            vendor = vendor.trim().ifBlank { null },
            isRecurring = recurring,
            incurredAt = isoDate(incurredAt),
            accountCode = account,
        )
        vm.saveExpense(editing?.id, body, onSuccess = onDismiss)
    }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        ) {
            Text(
                t(if (editing == null) "expenses.newExpense" else "expenses.editExpense", null),
                style = MaterialTheme.typography.titleLarge,
                color = Tokens.text,
            )
            AppSelectField(
                label = t("expenses.category", null),
                options = categories.map { SelectOption<String?>(it.id, it.name) },
                selected = categoryId,
                onSelect = { categoryId = it; categoryError = false },
            )
            if (categoryError) {
                Text(t("expenses.categoryRequired", null), style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
            }
            AppFormField(
                label = t("expenses.amount", null),
                value = amount,
                onValueChange = { amount = it; amountError = null },
                keyboardType = KeyboardType.Decimal,
                error = amountError,
            )
            AccountPicker(
                label = t("balance.payFrom", null),
                selected = account,
                options = accounts,
                onSelect = { account = it },
            )
            AppFormField(label = t("expenses.vendor", null), value = vendor, onValueChange = { vendor = it }, placeholder = t("expenses.vendorPlaceholder", null))
            AppFormField(label = t("expenses.description", null), value = description, onValueChange = { description = it }, placeholder = t("expenses.descriptionPlaceholder", null))
            DateField(t("expenses.incurredAt", null), incurredAt, onChanged = { incurredAt = it })
            Row(Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch), verticalAlignment = Alignment.CenterVertically) {
                Text(t("expenses.isRecurring", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
                Spacer(Modifier.weight(1f))
                AppSwitch(checked = recurring, onCheckedChange = { recurring = it })
            }
            PillButton(t("common.save", null), onClick = ::submit, modifier = Modifier.fillMaxWidth())
        }
    }
}
