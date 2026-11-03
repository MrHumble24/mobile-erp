package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import uz.malika.erp.features.finance.data.ExpenseSort
import uz.malika.erp.features.finance.model.ExpensesViewModel
import uz.malika.erp.features.finance.model.buildExpensesCsv
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.shareTextFile
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SearchFilterRow
import uz.malika.erp.ui.theme.Tokens

/** The Expenses tab body: compact actions + search, summary, filter sheet, paginated list. */
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
    var showFilters by remember { mutableStateOf(false) }

    // Inline filter UI state, hoisted so it survives the sheet opening and closing.
    var search by remember { mutableStateOf("") }
    var min by remember { mutableStateOf("") }
    var max by remember { mutableStateOf("") }
    var range by remember { mutableStateOf(DateRange()) }

    val filter = state.filter
    val activeFilters = listOf(
        filter.categoryId != null,
        filter.isRecurring != null,
        filter.minAmount != null,
        filter.maxAmount != null,
        filter.fromIso != null,
        filter.sort != ExpenseSort.NEWEST,
    ).count { it }

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
            SearchFilterRow(
                query = search,
                onQueryChange = { search = it; vm.setSearch(it) },
                placeholder = t("expenses.searchPlaceholder", null),
                activeCount = activeFilters,
                onOpenFilters = { showFilters = true },
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

    if (showFilters) {
        ExpenseFiltersSheet(
            categories = state.categories,
            filter = filter,
            min = min,
            max = max,
            range = range,
            onCategory = vm::setCategory,
            onRecurring = vm::setRecurring,
            onSort = vm::setSort,
            onMin = { min = it; vm.setAmount(min.toDoubleOrNull(), max.toDoubleOrNull()) },
            onMax = { max = it; vm.setAmount(min.toDoubleOrNull(), max.toDoubleOrNull()) },
            onRange = { range = it; vm.setRange(isoDate(it.startMillis), isoDate(it.endMillis)) },
            canReset = activeFilters > 0 || search.isNotBlank(),
            onReset = {
                search = ""; min = ""; max = ""; range = DateRange()
                vm.clearFilters()
            },
            onDismiss = { showFilters = false },
        )
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

/** Prominent new-expense action with secondary actions (categories, CSV) in an overflow menu. */
@Composable
private fun Header(canManage: Boolean, onCategories: () -> Unit, onNew: () -> Unit, onCsv: () -> Unit, csvEnabled: Boolean) {
    val t = LocalT.current
    var menu by remember { mutableStateOf(false) }
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        if (canManage) {
            PillButton(t("expenses.newExpense", null), onClick = onNew, modifier = Modifier.weight(1f))
            Spacer(Modifier.width(8.dp))
        } else {
            Spacer(Modifier.weight(1f))
        }
        Box {
            IconButton(onClick = { menu = true }) {
                Icon(Icons.Filled.MoreVert, contentDescription = t("common.actions", null), tint = Tokens.foreground)
            }
            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                DropdownMenuItem(
                    text = { Text(t("expenses.categories", null)) },
                    onClick = { menu = false; onCategories() },
                )
                DropdownMenuItem(
                    text = { Text(t("expenses.exportCsv", null)) },
                    enabled = csvEnabled,
                    onClick = { menu = false; onCsv() },
                )
            }
        }
    }
}
