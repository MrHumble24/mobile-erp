package uz.malika.erp.features.finance.ui.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.features.finance.model.ExpensesViewModel
import uz.malika.erp.features.finance.model.FinanceEvent
import uz.malika.erp.features.finance.ui.components.financeViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

private enum class ExpenseTab { EXPENSES, RECURRING }

/**
 * Shop expenses (perm `expense.read`): a list tab (summary + filters + list +
 * CSV) and a recurring-templates tab, with one shared snackbar. All writes are
 * online-only (gated in the ViewModels).
 */
@Composable
fun ExpensesScreen(container: AppContainer) {
    val t = LocalT.current
    val vm = financeViewModel(container) { ExpensesViewModel(it) }
    val notify: (FinanceEvent) -> Unit = { event ->
        when (event) {
            is FinanceEvent.Message -> container.toaster.success(t(event.key, null))
            is FinanceEvent.Failure -> container.toaster.error(event.text)
            is FinanceEvent.Count -> container.toaster.success(t(event.key, mapOf("count" to event.count)))
        }
    }

    LaunchedEffect(vm) { vm.events.collect(notify) }

    val state by vm.state.collectAsState()
    var tab by remember { mutableStateOf(ExpenseTab.EXPENSES) }

    // The AppShell Scaffold already reserves status/navigation-bar insets; zero this
    // nested Scaffold's own so the top gutter and bottom are not padded twice. The
    // app-wide ToastHost (MalikaApp) renders events from the shared Toaster.
    Scaffold(
        containerColor = Tokens.ground,
        contentWindowInsets = WindowInsets(0),
    ) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            SegmentedControl(
                options = listOf(
                    SegmentOption(ExpenseTab.EXPENSES, t("expenses.tabExpenses", null)),
                    SegmentOption(ExpenseTab.RECURRING, t("expenses.tabRecurring", null)),
                ),
                selected = tab,
                onSelect = { tab = it },
                modifier = Modifier.padding(horizontal = Tokens.Space.screenH, vertical = Tokens.Space.md),
            )
            when (tab) {
                ExpenseTab.EXPENSES -> ExpenseListSection(vm, container, Modifier.weight(1f))
                ExpenseTab.RECURRING -> RecurringSection(container, state.categories, notify, Modifier.weight(1f))
            }
        }
    }
}
