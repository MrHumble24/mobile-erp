package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import uz.malika.erp.features.finance.data.Expense
import uz.malika.erp.features.finance.model.ExpensesViewModel
import uz.malika.erp.features.finance.model.FinanceEvent
import uz.malika.erp.features.finance.ui.components.financeViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Shop expenses (perm `expense.read`): summary + filters + list, with
 * log-expense (perm `expense.manage`) and manage-categories actions. All
 * writes are online-only (gated in the ViewModel).
 */
@Composable
fun ExpensesScreen(container: AppContainer) {
    val t = LocalT.current
    val can = LocalCan.current
    val vm = financeViewModel(container) { ExpensesViewModel(it) }
    val state by vm.state.collectAsState()
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(vm) {
        vm.events.collect { event ->
            snackbar.showSnackbar(
                when (event) {
                    is FinanceEvent.Message -> t(event.key, null)
                    is FinanceEvent.Failure -> event.text
                },
            )
        }
    }

    var showCategories by remember { mutableStateOf(false) }
    var showLog by remember { mutableStateOf(false) }
    var detail by remember { mutableStateOf<Expense?>(null) }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        containerColor = Tokens.background,
    ) { pad ->
        LazyColumn(
            Modifier.fillMaxSize().padding(pad).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Header(
                    canManage = can("expense.manage"),
                    onCategories = { showCategories = true },
                    onLog = { showLog = true },
                )
            }
            item { ExpenseSummaryCard(state.summary) }
            item {
                ExpenseFilters(
                    categories = state.categories,
                    filter = state.filter,
                    onCategory = vm::setCategory,
                    onRecurring = vm::setRecurring,
                )
            }
            when {
                state.loading && state.expenses.isEmpty() -> item {
                    Box(Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Tokens.primary)
                    }
                }
                state.error != null -> item {
                    ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::reload)
                }
                state.expenses.isEmpty() -> item { EmptyView(t("expenses.noExpensesFound", null)) }
                else -> items(state.expenses) { expense ->
                    ExpenseRow(expense) { detail = expense }
                }
            }
        }
    }

    if (showCategories) {
        ExpenseCategoriesSheet(
            vm = vm,
            categories = state.categories,
            canManage = can("expense.category.manage"),
            onDismiss = { showCategories = false },
        )
    }
    if (showLog) {
        LogExpenseSheet(vm = vm, categories = state.categories, onDismiss = { showLog = false })
    }
    detail?.let { expense ->
        ExpenseDetailSheet(
            expense = expense,
            canManage = can("expense.manage"),
            onDelete = { vm.remove(expense); detail = null },
            onDismiss = { detail = null },
        )
    }
}

@Composable
private fun Header(canManage: Boolean, onCategories: () -> Unit, onLog: () -> Unit) {
    val t = LocalT.current
    androidx.compose.foundation.layout.Column(
        Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        androidx.compose.foundation.layout.Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(t("expenses.title", null), style = MaterialTheme.typography.headlineSmall)
            PillButton(t("expenses.categories", null), onClick = onCategories, variant = ButtonVariant.OUTLINE)
        }
        if (canManage) {
            PillButton(t("expenses.newExpense", null), onClick = onLog, modifier = Modifier.fillMaxWidth())
        }
    }
}
