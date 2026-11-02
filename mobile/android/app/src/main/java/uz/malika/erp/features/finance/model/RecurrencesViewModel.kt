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
import uz.malika.erp.features.finance.data.CreateRecurrenceBody
import uz.malika.erp.features.finance.data.ExpenseRecurrence
import uz.malika.erp.features.finance.data.FinanceApi
import uz.malika.erp.features.finance.data.RecurrencesRepository
import uz.malika.erp.features.finance.data.UpdateRecurrenceBody

data class RecurrencesUiState(
    val loading: Boolean = true,
    val error: String? = null,
    val items: List<ExpenseRecurrence> = emptyList(),
)

/**
 * Drives the recurring-expense templates tab: list, create/edit, activate
 * toggle and "generate due". All writes are online-only (refused with
 * `common.offline` otherwise); generate reports how many expenses it spawned.
 */
class RecurrencesViewModel(private val container: AppContainer) : ViewModel() {

    private val repo = RecurrencesRepository(container.retrofit.create(FinanceApi::class.java))

    private val _state = MutableStateFlow(RecurrencesUiState())
    val state: StateFlow<RecurrencesUiState> = _state.asStateFlow()

    private val _events = MutableSharedFlow<FinanceEvent>(extraBufferCapacity = 4)
    val events = _events.asSharedFlow()

    init { reload() }

    fun reload() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(loading = false, items = repo.list())
            } catch (e: AppException) {
                _state.value = _state.value.copy(loading = false, error = e.message)
            }
        }
    }

    fun save(id: String?, create: CreateRecurrenceBody, onSuccess: () -> Unit) =
        write("expenses.recurrenceSaved", onSuccess) {
            if (id == null) {
                repo.create(create)
            } else {
                repo.update(
                    id,
                    UpdateRecurrenceBody(
                        categoryId = create.categoryId,
                        amount = create.amount,
                        description = create.description,
                        vendor = create.vendor,
                        frequency = create.frequency,
                        nextDueAt = create.nextDueAt,
                    ),
                )
            }
        }

    fun toggleActive(recurrence: ExpenseRecurrence) =
        write("expenses.recurrenceSaved", {}) {
            repo.update(recurrence.id, UpdateRecurrenceBody(isActive = !recurrence.isActive))
        }

    fun generateDue() {
        if (offline()) return
        viewModelScope.launch {
            try {
                val count = repo.generateDue()
                _events.tryEmit(FinanceEvent.Count("expenses.generated", count))
                reload()
            } catch (e: AppException) {
                _events.tryEmit(FinanceEvent.Failure(e.message))
            }
        }
    }

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
