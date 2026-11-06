package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.sales.data.CustomerBonusDto
import uz.malika.erp.features.sales.data.CustomersRepository

/** Loads the bonus of one customer. State: loading, the DTO, or an error message. */
sealed class CustomerBonusState {
    object Loading : CustomerBonusState()
    data class Ok(val dto: CustomerBonusDto) : CustomerBonusState()
    data class Fail(val message: String) : CustomerBonusState()
}

class CustomerBonusViewModel(
    private val repo: CustomersRepository,
    private val customerId: String,
) : ViewModel() {

    private val _state = MutableStateFlow<CustomerBonusState>(CustomerBonusState.Loading)
    val state: StateFlow<CustomerBonusState> = _state.asStateFlow()

    fun load() {
        _state.value = CustomerBonusState.Loading
        viewModelScope.launch {
            try {
                _state.value = CustomerBonusState.Ok(repo.bonus(customerId))
            } catch (e: Exception) {
                _state.value = CustomerBonusState.Fail((e as? AppException)?.message ?: "error")
            }
        }
    }

    /** Posts the correction and puts the answer in the state. */
    fun adjust(amount: Double, reason: String) {
        viewModelScope.launch {
            try {
                _state.value = CustomerBonusState.Ok(repo.adjustBonus(customerId, amount, reason))
            } catch (e: Exception) {
                _state.value = CustomerBonusState.Fail((e as? AppException)?.message ?: "error")
            }
        }
    }
}
