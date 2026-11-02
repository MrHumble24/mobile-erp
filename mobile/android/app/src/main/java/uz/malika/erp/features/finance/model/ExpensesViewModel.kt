package uz.malika.erp.features.finance.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.finance.data.CreateExpenseBody
import uz.malika.erp.features.finance.data.Expense
import uz.malika.erp.features.finance.data.ExpenseCategory
import uz.malika.erp.features.finance.data.ExpenseFilter
import uz.malika.erp.features.finance.data.ExpenseSort
import uz.malika.erp.features.finance.data.ExpenseSummary
import uz.malika.erp.features.finance.data.ExpensesRepository
import uz.malika.erp.features.finance.data.FinanceApi
import uz.malika.erp.features.finance.data.UpdateCategoryBody
import uz.malika.erp.shared.lib.PageState

data class ExpensesUiState(
    val filter: ExpenseFilter = ExpenseFilter(),
    val page: PageState<Expense> = PageState(),
    val error: String? = null,
    val summary: ExpenseSummary? = null,
    val categories: List<ExpenseCategory> = emptyList(),
)

/**
 * Drives the expenses list: filters (category, recurring, search, amount, date
 * range, sort), paginated list (`PageState` + load-more), summary and
 * categories, plus the online-only expense/category writes. A write while
 * offline is refused with `common.offline` — expenses are not in the outbox.
 * Text/amount filters debounce (300 ms) before refetching.
 */
class ExpensesViewModel(private val container: AppContainer) : ViewModel() {

    private val repo = ExpensesRepository(container.retrofit.create(FinanceApi::class.java))

    private val _state = MutableStateFlow(ExpensesUiState())
    val state: StateFlow<ExpensesUiState> = _state.asStateFlow()

    private val _events = MutableSharedFlow<FinanceEvent>(extraBufferCapacity = 4)
    val events = _events.asSharedFlow()

    private var debounceJob: Job? = null

    init { reload() }

    private fun patch(transform: (ExpenseFilter) -> ExpenseFilter) {
        _state.value = _state.value.copy(filter = transform(_state.value.filter))
    }

    fun setCategory(categoryId: String?) { patch { it.copy(categoryId = categoryId) }; reload() }
    fun setRecurring(isRecurring: Boolean?) { patch { it.copy(isRecurring = isRecurring) }; reload() }
    fun setSort(sort: ExpenseSort) { patch { it.copy(sort = sort) }; reload() }

    fun setRange(fromIso: String?, toIso: String?) {
        patch { it.copy(fromIso = fromIso, toIso = toIso) }
        reload()
    }

    /** Debounced text/amount filters — refetch once typing settles. */
    fun setSearch(search: String) = debounce { patch { it.copy(search = search) } }
    fun setAmount(min: Double?, max: Double?) = debounce { patch { it.copy(minAmount = min, maxAmount = max) } }

    private fun debounce(apply: () -> Unit) {
        debounceJob?.cancel()
        debounceJob = viewModelScope.launch {
            delay(300)
            apply()
            reload()
        }
    }

    fun reload() {
        loadPage(1)
        viewModelScope.launch {
            runCatching { repo.summary(_state.value.filter) }
                .onSuccess { s -> _state.value = _state.value.copy(summary = s) }
            runCatching { repo.categories() }
                .onSuccess { c -> _state.value = _state.value.copy(categories = c) }
        }
    }

    fun loadMore() {
        val page = _state.value.page
        if (page.loading || !page.hasMore) return
        loadPage(page.nextPage)
    }

    private fun loadPage(page: Int) {
        _state.value = _state.value.copy(
            page = _state.value.page.copy(loading = true),
            error = if (page <= 1) null else _state.value.error,
        )
        viewModelScope.launch {
            try {
                val result = repo.list(_state.value.filter, page)
                _state.value = _state.value.copy(
                    page = _state.value.page.append(result.items, result.total, page),
                    error = null,
                )
            } catch (e: AppException) {
                _state.value = _state.value.copy(
                    page = _state.value.page.copy(loading = false),
                    error = e.message,
                )
            }
        }
    }

    fun saveExpense(id: String?, body: CreateExpenseBody, onSuccess: () -> Unit) =
        write("expenses.expenseSaved", onSuccess) {
            if (id == null) repo.create(body) else repo.update(id, body)
        }

    fun addCategory(name: String, onSuccess: () -> Unit) =
        write("expenses.categorySaved", onSuccess) { repo.addCategory(name) }

    fun updateCategory(id: String, body: UpdateCategoryBody, onConflict: () -> Unit, onSuccess: () -> Unit) {
        if (offline()) return
        viewModelScope.launch {
            try {
                repo.updateCategory(id, body)
                _events.tryEmit(FinanceEvent.Message("expenses.categorySaved"))
                onSuccess()
                reload()
            } catch (e: AppException) {
                if (e.statusCode == 409) onConflict() else _events.tryEmit(FinanceEvent.Failure(e.message))
            }
        }
    }

    fun remove(expense: Expense) = write("expenses.expenseDeleted", {}) { repo.remove(expense.id) }

    private fun offline(): Boolean {
        if (!container.connectivity.online.value) {
            _events.tryEmit(FinanceEvent.Message("common.offline"))
            return true
        }
        return false
    }

    private fun write(successKey: String, onSuccess: () -> Unit, block: suspend () -> Unit) {
        if (offline()) return
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
