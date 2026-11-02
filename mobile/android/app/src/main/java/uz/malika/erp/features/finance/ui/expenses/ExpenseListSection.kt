package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.Expense
import uz.malika.erp.features.finance.model.ExpensesViewModel
import uz.malika.erp.features.finance.model.buildExpensesCsv
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.shareTextFile
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** The Expenses tab body: header actions, summary, filters, paginated list. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ExpenseListSection(vm: ExpensesViewModel, container: AppContainer, modifier: Modifier = Modifier) {
    val t = LocalT.current
    val can = LocalCan.current
    val context = LocalContext.current
    val state by vm.state.collectAsState()

    var showCategories by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Expense?>(null) }
    var showLog by remember { mutableStateOf(false) }
    var detail by remember { mutableStateOf<Expense?>(null) }

    LazyColumn(
        modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Header(
                canManage = can("expense.manage"),
                onCategories = { showCategories = true },
                onNew = { editing = null; showLog = true },
                onCsv = {
                    val name = "expenses-${System.currentTimeMillis()}.csv"
                    shareTextFile(context, name, buildExpensesCsv(state.page.items), chooserTitle = t("expenses.exportCsv", null))
                },
                csvEnabled = state.page.items.isNotEmpty(),
            )
        }
        item { ExpenseSummaryCard(state.summary) }
        item {
            ExpenseFilters(
                categories = state.categories,
                filter = state.filter,
                onCategory = vm::setCategory,
                onRecurring = vm::setRecurring,
                onSearch = vm::setSearch,
                onAmount = vm::setAmount,
                onSort = vm::setSort,
                onRange = vm::setRange,
            )
        }
        val items = state.page.items
        when {
            state.page.loading && items.isEmpty() -> item {
                Box(Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Tokens.primary)
                }
            }
            state.error != null && items.isEmpty() -> item {
                ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::reload)
            }
            items.isEmpty() -> item { EmptyView(t("expenses.noExpensesFound", null)) }
            else -> {
                items(items) { expense -> ExpenseRow(expense) { detail = expense } }
                item { LoadMoreFooter(state.page.hasMore, state.page.loading, vm::loadMore) }
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
        LogExpenseSheet(
            vm = vm,
            categories = state.categories,
            editing = editing,
            onDismiss = { showLog = false },
        )
    }
    detail?.let { expense ->
        ExpenseDetailSheet(
            expense = expense,
            canManage = can("expense.manage"),
            onDelete = { vm.remove(expense); detail = null },
            onEdit = { editing = expense; detail = null; showLog = true },
            onDismiss = { detail = null },
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Header(canManage: Boolean, onCategories: () -> Unit, onNew: () -> Unit, onCsv: () -> Unit, csvEnabled: Boolean) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(t("expenses.title", null), style = MaterialTheme.typography.headlineSmall)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            PillButton(t("expenses.categories", null), onClick = onCategories, variant = ButtonVariant.OUTLINE)
            if (csvEnabled) PillButton(t("expenses.exportCsv", null), onClick = onCsv, variant = ButtonVariant.OUTLINE)
            if (canManage) PillButton(t("expenses.newExpense", null), onClick = onNew)
        }
    }
}
