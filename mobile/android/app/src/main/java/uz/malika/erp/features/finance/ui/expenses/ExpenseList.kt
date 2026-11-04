package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.Expense
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One expense card: category + recurring pill, mono date, description left; mono amount right. */
@Composable
fun ExpenseRow(expense: Expense, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(expense.categoryName, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(formatDate(expense.incurredAt), style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
                expense.description?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                }
                if (expense.isRecurring) {
                    Spacer(Modifier.height(2.dp))
                    StatusChip(t("expenses.tabRecurring", null), color = Tokens.info)
                }
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            MoneyText(expense.amount, style = MaterialTheme.typography.titleSmall.copy(color = Tokens.text))
        }
    }
}

/** Expense detail: keyed fact rows, then edit (secondary) and delete (destructive) for `expense.manage`. */
@Composable
fun ExpenseDetailSheet(
    expense: Expense,
    canManage: Boolean,
    onDelete: () -> Unit,
    onEdit: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)
    val plain = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text)
    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
            Text(expense.categoryName.ifBlank { t("expenses.detailTitle", null) }, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
            Spacer(Modifier.height(Tokens.Space.lg))
            FactRow(t("expenses.amount", null)) { MoneyText(expense.amount, style = plain) }
            FactRow(t("expenses.incurredAt", null)) { Text(formatDate(expense.incurredAt), style = mono) }
            FactRow(t("expenses.vendor", null)) { Text(expense.vendor?.ifBlank { null } ?: "—", style = plain) }
            FactRow(t("expenses.isRecurring", null)) { Text(t(if (expense.isRecurring) "common.yes" else "common.no", null), style = plain) }
            expense.description?.takeIf { it.isNotBlank() }?.let {
                FactRow(t("expenses.description", null)) { Text(it, style = plain) }
            }
            FactRow(t("expenses.recordedBy", null), last = true) { Text(expense.createdBy?.displayName?.ifBlank { null } ?: "—", style = plain) }
            if (canManage) {
                Spacer(Modifier.height(Tokens.Space.lg))
                Column(verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                    PillButton(t("expenses.editExpense", null), onClick = onEdit, variant = ButtonVariant.SECONDARY, modifier = Modifier.fillMaxWidth())
                    PillButton(t("expenses.deleteExpense", null), onClick = onDelete, variant = ButtonVariant.DESTRUCTIVE, modifier = Modifier.fillMaxWidth())
                }
            }
            Spacer(Modifier.height(Tokens.Space.sm))
        }
    }
}
