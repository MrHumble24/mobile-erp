package uz.malika.erp.features.repairs.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import uz.malika.erp.core.AppException
import uz.malika.erp.features.repairs.data.RepairRepository
import uz.malika.erp.features.repairs.data.RepairView

data class CreateRepairState(
    val submitting: Boolean = false,
    val error: String? = null,
    val result: RepairView? = null,
)

/** Posts one `POST /repairs` (ADR 0040). Online only; a failure shows the server message. */
class CreateRepairViewModel(private val repo: RepairRepository) : ViewModel() {

    private val _state = MutableStateFlow(CreateRepairState())
    val state = _state.asStateFlow()

    fun submit(body: JsonObject) {
        if (_state.value.submitting) return
        _state.value = CreateRepairState(submitting = true)
        viewModelScope.launch {
            try {
                _state.value = CreateRepairState(result = repo.create(body))
            } catch (e: AppException) {
                _state.value = CreateRepairState(error = e.message)
            }
        }
    }
}
