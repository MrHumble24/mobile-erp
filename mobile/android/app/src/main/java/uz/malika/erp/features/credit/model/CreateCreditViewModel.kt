package uz.malika.erp.features.credit.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import uz.malika.erp.core.AppException
import uz.malika.erp.features.credit.data.CreditRepository
import uz.malika.erp.features.credit.data.CreditView
import uz.malika.erp.features.credit.lib.creditErrorKey

data class CreateCreditState(
    val submitting: Boolean = false,
    /** An i18n key (credit.*) when the error maps to one, else null. */
    val errorKey: String? = null,
    /** The raw server message when no mapped key applies. */
    val errorText: String? = null,
    /** A 409 NO_OPEN_SHIFT — the till offers "open a shift". */
    val needsShift: Boolean = false,
    val result: CreditView? = null,
)

/**
 * Posts one `POST /credits` (ADR 0035). Online only — the caller blocks the
 * button offline. A 409 `NO_OPEN_SHIFT` is surfaced so the till can offer to open
 * a shift (ADR 0036); 400s map to a `credit.*` key via [creditErrorKey].
 */
class CreateCreditViewModel(private val repo: CreditRepository) : ViewModel() {

    private val _state = MutableStateFlow(CreateCreditState())
    val state = _state.asStateFlow()

    fun submit(body: JsonObject) {
        if (_state.value.submitting) return
        _state.value = CreateCreditState(submitting = true)
        viewModelScope.launch {
            try {
                _state.value = CreateCreditState(result = repo.create(body))
            } catch (e: AppException) {
                _state.value = when {
                    e.statusCode == 409 && e.code == "NO_OPEN_SHIFT" -> CreateCreditState(needsShift = true)
                    else -> {
                        val key = creditErrorKey(e)
                        CreateCreditState(errorKey = key, errorText = if (key == null) e.message else null)
                    }
                }
            }
        }
    }

    fun reset() { _state.value = CreateCreditState() }
}
