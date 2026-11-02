package uz.malika.erp.features.admin.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.admin.data.SettingsForm
import uz.malika.erp.features.admin.data.SettingsRepository
import uz.malika.erp.features.admin.data.StoreSettingsDto

/** Store settings: load the singleton, then PUT the edited form (online-only). */
class SettingsViewModel(private val repo: SettingsRepository) : ViewModel() {

    private val _state = MutableStateFlow<Async<StoreSettingsDto>>(Async.Loading)
    val state: StateFlow<Async<StoreSettingsDto>> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch { _state.value = asyncOf { repo.get() } }
    }

    /** Saves and swaps in the server's canonical copy. Throws on failure. */
    suspend fun save(form: SettingsForm) {
        val updated = repo.update(form)
        _state.value = Async.Ok(updated)
    }
}
