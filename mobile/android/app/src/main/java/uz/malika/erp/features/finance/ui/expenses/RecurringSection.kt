package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.ExpenseRecurrence
import uz.malika.erp.features.finance.model.FinanceEvent
import uz.malika.erp.features.finance.model.RecurrencesViewModel
import uz.malika.erp.features.finance.ui.components.financeViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** The Recurring tab body: templates list + generate-due + create/edit. */
@Composable
fun RecurringSection(
    container: AppContainer,
    categories: List<ExpenseCategory>,
    notify: (FinanceEvent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    val canManage = LocalCan.current("expense.manage")
    val vm = financeViewModel(container) { RecurrencesViewModel(it) }
    val state by vm.state.collectAsState()

    LaunchedEffect(vm) { vm.events.collect(notify) }

    var editing by remember { mutableStateOf<ExpenseRecurrence?>(null) }
    var showForm by remember { mutableStateOf(false) }

    LazyColumn(
        modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = Tokens.Space.screenH, end = Tokens.Space.screenH, bottom = listBottomPadding().calculateBottomPadding()),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        if (canManage) {
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                    PillButton(t("expenses.newRecurrence", null), onClick = { editing = null; showForm = true }, modifier = Modifier.weight(1f))
                    PillButton(t("expenses.generateDue", null), onClick = vm::generateDue, variant = ButtonVariant.SECONDARY, modifier = Modifier.weight(1f))
                }
            }
        }
        when {
            state.loading && state.items.isEmpty() -> item {
                Box(Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) { Loading() }
            }
            state.error != null -> item {
                ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::reload)
            }
            state.items.isEmpty() -> item { AppCard(Modifier.fillMaxWidth()) { EmptyView(t("expenses.noRecurrences", null), compact = true) } }
            else -> items(state.items) { r ->
                RecurrenceCard(r, canManage, onEdit = { editing = r; showForm = true }, onToggle = { vm.toggleActive(r) })
            }
        }
    }

    if (showForm) {
        RecurrenceSheet(container = container, vm = vm, categories = categories, editing = editing, onDismiss = { showForm = false })
    }
}

@Composable
private fun RecurrenceCard(
    r: ExpenseRecurrence,
    canManage: Boolean,
    onEdit: () -> Unit,
    onToggle: () -> Unit,
) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(r.categoryName, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                Text(
                    "${t(if (r.frequency == "weekly") "expenses.frequencyWeekly" else "expenses.frequencyMonthly", null)} · ${formatDate(r.nextDueAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.muted,
                )
                r.description?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted) }
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
                MoneyText(r.amount, style = MaterialTheme.typography.titleSmall.copy(color = Tokens.text))
                StatusChip(
                    if (r.isActive) t("expenses.recurrenceActive", null) else t("expenses.markInactive", null),
                    color = if (r.isActive) Tokens.success else Tokens.sold,
                )
            }
        }
        if (canManage) {
            Spacer(Modifier.height(Tokens.Space.md))
            Row(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
                PillButton(t("common.edit", null), onClick = onEdit, variant = ButtonVariant.SECONDARY, modifier = Modifier.weight(1f))
                PillButton(
                    t(if (r.isActive) "expenses.markInactive" else "expenses.markActive", null),
                    onClick = onToggle,
                    variant = ButtonVariant.GHOST,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}
