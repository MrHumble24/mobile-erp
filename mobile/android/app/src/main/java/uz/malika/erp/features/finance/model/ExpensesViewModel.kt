package uz.malika.erp.features.finance.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.finance.data.Expense
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.ExpenseFilter
import uz.malika.erp.features.finance.data.ExpenseSummary
import uz.malika.erp.features.finance.data.ExpensesRepository
import uz.malika.erp.features.finance.data.FinanceApi

data class ExpensesUiState(
    val filter: ExpenseFilter = ExpenseFilter(),
    val loading: Boolean = true,
    val error: String? = null,
    val expenses: List<Expense> = emptyList(),
    val summary: ExpenseSummary? = null,
    val categories: List<ExpenseCategory> = emptyList(),
)

/**
 * Drives the expenses screen: the list (filtered), summary card and category
 * set, plus the online-only log/delete/add-category writes. A write while
 * offline is refused with a `common.offline` message — expenses are not in the
 * offline outbox.
 */
class ExpensesViewModel(private val container: AppContainer) : ViewModel() {

    private val repo = ExpensesRepository(container.retrofit.create(FinanceApi::class.java))

    private val _state = MutableStateFlow(ExpensesUiState())
    val state: StateFlow<ExpensesUiState> = _state.asStateFlow()

    private val _events = MutableSharedFlow<FinanceEvent>(extraBufferCapacity = 4)
    val events = _events.asSharedFlow()

    init { reload() }

    fun setCategory(categoryId: String?) {
        _state.value = _state.value.copy(filter = _state.value.filter.copy(categoryId = categoryId))
        loadList()
    }

    fun setRecurring(isRecurring: Boolean?) {
        _state.value = _state.value.copy(filter = _state.value.filter.copy(isRecurring = isRecurring))
        loadList()
    }

    fun reload() {
        loadList()
        viewModelScope.launch {
            runCatching { repo.summary() }.onSuccess { s -> _state.value = _state.value.copy(summary = s) }
            runCatching { repo.categories() }.onSuccess { c -> _state.value = _state.value.copy(categories = c) }
        }
    }

    private fun loadList() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                val page = repo.list(_state.value.filter)
                _state.value = _state.value.copy(loading = false, expenses = page.items)
            } catch (e: AppException) {
                _state.value = _state.value.copy(loading = false, error = e.message)
            }
        }
    }

    fun createExpense(
        categoryId: String,
        amount: Double,
        description: String?,
        isRecurring: Boolean,
        incurredAtIso: String?,
        onSuccess: () -> Unit,
    ) = write("expenses.expenseSaved", onSuccess) {
        repo.create(categoryId, amount, description, isRecurring, incurredAtIso)
    }

    fun addCategory(name: String, onSuccess: () -> Unit) =
        write("expenses.categorySaved", onSuccess) { repo.addCategory(name) }

    fun remove(expense: Expense) = write("expenses.expenseDeleted", {}) { repo.remove(expense.id) }

    private fun write(successKey: String, onSuccess: () -> Unit, block: suspend () -> Unit) {
        if (!container.connectivity.online.value) {
            _events.tryEmit(FinanceEvent.Message("common.offline"))
            return
        }
        viewModelScope.launch {
            try {
                block()
                _events.tryEmit(FinanceEvent.Message(successKey))
                onSuccess()
                reload()
            } catch (e: AppException) {
                _events.tryEmit(FinanceEvent.Failure(e.message))
            }
        }
    }
}
