package uz.malika.erp.features.credit.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.credit.data.CreditRepository
import uz.malika.erp.features.credit.data.CreditView

data class CreditDetailState(
    val loading: Boolean = true,
    val error: String? = null,
    val credit: CreditView? = null,
    val submitting: Boolean = false,
    val actionError: String? = null,
)

/** One credit agreement: load it, take a payment, refund an overpayment (ADR 0035). */
class CreditDetailViewModel(
    private val repo: CreditRepository,
    private val creditId: String,
) : ViewModel() {

    private val _state = MutableStateFlow(CreditDetailState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(loading = false, credit = repo.get(creditId))
            } catch (e: AppException) {
                _state.value = _state.value.copy(loading = false, error = e.message)
            }
        }
    }

    fun takePayment(amount: Double, accountCode: String, onDone: () -> Unit) =
        run({ repo.addPayment(creditId, amount, accountCode) }, onDone)

    fun refund(amount: Double, accountCode: String, onDone: () -> Unit) =
        run({ repo.refund(creditId, amount, accountCode) }, onDone)

    fun clearActionError() { _state.value = _state.value.copy(actionError = null) }

    private fun run(call: suspend () -> CreditView, onDone: () -> Unit) {
        if (_state.value.submitting) return
        _state.value = _state.value.copy(submitting = true, actionError = null)
        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(submitting = false, credit = call())
                onDone()
            } catch (e: AppException) {
                _state.value = _state.value.copy(submitting = false, actionError = e.message)
            }
        }
    }
}
