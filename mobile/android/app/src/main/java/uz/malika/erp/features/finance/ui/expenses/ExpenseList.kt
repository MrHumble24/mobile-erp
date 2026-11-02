package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.finance.data.Expense
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

private fun dayOf(iso: String?): String = iso?.substringBefore('T') ?: "—"

/** One expense as a tappable card (date, category + recurring chip, amount). */
@Composable
fun ExpenseRow(expense: Expense, onClick: () -> Unit) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onClick) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(expense.categoryName, style = MaterialTheme.typography.titleMedium)
                    if (expense.isRecurring) {
                        Spacer(Modifier.width(8.dp))
                        StatusChip(t("expenses.isRecurring", null), color = Tokens.success)
                    }
                }
                Spacer(Modifier.height(2.dp))
                Text(dayOf(expense.incurredAt), style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
                if (!expense.description.isNullOrBlank()) {
                    Spacer(Modifier.height(2.dp))
                    Text(expense.description, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
                }
            }
            MoneyText(expense.amount, style = MaterialTheme.typography.titleMedium)
        }
    }
}

/** Expense detail sheet with an online-only delete for users with `expense.manage`. */
@Composable
fun ExpenseDetailSheet(
    expense: Expense,
    canManage: Boolean,
    onDelete: () -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(expense.categoryName, style = MaterialTheme.typography.headlineSmall)
            DetailLine(t("common.amount", null), null) { MoneyText(expense.amount, style = MaterialTheme.typography.bodyLarge) }
            DetailLine(t("expenses.incurredAt", null), dayOf(expense.incurredAt))
            DetailLine(t("expenses.isRecurring", null), if (expense.isRecurring) t("common.yes", null) else t("common.no", null))
            if (!expense.description.isNullOrBlank()) {
                DetailLine(t("expenses.description", null), expense.description)
            }
            if (canManage) {
                Spacer(Modifier.height(8.dp))
                PillButton(
                    t("expenses.deleteExpense", null),
                    onClick = onDelete,
                    variant = ButtonVariant.DESTRUCTIVE,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun DetailLine(label: String, value: String?, trailing: @Composable (() -> Unit)? = null) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = Tokens.mutedForeground)
        if (trailing != null) trailing() else Text(value ?: "—", style = MaterialTheme.typography.bodyMedium)
    }
}
