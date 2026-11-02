package uz.malika.erp.features.nasiya.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppException
import uz.malika.erp.features.nasiya.data.NasiyaModule

/** Loads a partner's ledger + aging (online). Reloadable on retry. */
class LedgerViewModel(container: AppContainer, private val partnerId: String) : ViewModel() {

    private val repo = NasiyaModule.partnerRepository(container)
    private val _state = MutableStateFlow(LedgerState())
    val state = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.value = LedgerState(loading = true)
        viewModelScope.launch {
            try {
                val entries = repo.ledger(partnerId)
                val aging = repo.aging(partnerId)
                _state.value = LedgerState(loading = false, entries = entries, aging = aging)
            } catch (e: AppException) {
                _state.value = LedgerState(loading = false, error = e.message)
            }
        }
    }
}
