package uz.malika.erp.features.purchases.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.CatalogRepository
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.purchases.data.CustomerPurchaseDto
import uz.malika.erp.features.purchases.data.PurchaseRepository

data class BuyPhoneState(
    val models: List<DeviceModelView> = emptyList(),
    val submitting: Boolean = false,
    /** An i18n key (purchases.*) when the error maps to one, else null. */
    val errorKey: String? = null,
    /** The raw server message when no mapped key applies. */
    val errorText: String? = null,
    /** A 409 NO_OPEN_SHIFT — the sheet offers "open a shift". */
    val needsShift: Boolean = false,
    val result: CustomerPurchaseDto? = null,
)

/**
 * Loads the sellable models and posts one `POST /customer-purchases` (ADR 0039).
 * Online only — the caller blocks the button offline. A duplicate IMEI/serial is
 * a 409 (`purchases.buyConflict`); a 409 `NO_OPEN_SHIFT` surfaces the shift gate.
 */
class BuyPhoneViewModel(
    private val repo: PurchaseRepository,
    private val catalog: CatalogRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(BuyPhoneState())
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch {
            runCatching { catalog.list() }.getOrNull()?.let { _state.value = _state.value.copy(models = it) }
        }
    }

    fun submit(body: JsonObject) {
        if (_state.value.submitting) return
        _state.value = _state.value.copy(submitting = true, errorKey = null, errorText = null, needsShift = false)
        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(submitting = false, result = repo.create(body))
            } catch (e: AppException) {
                _state.value = when {
                    e.code == "NO_OPEN_SHIFT" -> _state.value.copy(submitting = false, needsShift = true)
                    e.statusCode == 409 -> _state.value.copy(submitting = false, errorKey = "purchases.buyConflict")
                    else -> _state.value.copy(submitting = false, errorText = e.message)
                }
            }
        }
    }

    fun clearError() { _state.value = _state.value.copy(errorKey = null, errorText = null, needsShift = false) }
}
