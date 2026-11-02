package uz.malika.erp.features.auth.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.data.sync.SyncManager
import uz.malika.erp.features.auth.data.AuthRepository
import uz.malika.erp.features.auth.data.AuthUser

data class SessionState(
    val user: AuthUser? = null,
    val loading: Boolean = false,
    val error: AppException? = null,
)

/**
 * Single source of truth for the session. Restores the persisted user on
 * creation, logs in/out, and clears itself on a 401 signalled by [AuthEvents]
 * (the HTTP client already wiped the token). On login it kicks a sync to
 * hydrate the offline cache.
 */
class SessionViewModel(
    private val repo: AuthRepository,
    authEvents: AuthEvents,
    private val syncManager: SyncManager,
) : ViewModel() {

    private val _state = MutableStateFlow(SessionState(user = repo.cachedUser()))
    val state: StateFlow<SessionState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authEvents.unauthorized.collect { _state.value = SessionState(user = null) }
        }
        if (_state.value.user != null) syncManager.syncNow() // hydrate on restored session
    }

    fun login(email: String, password: String) {
        if (_state.value.loading) return
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                val user = repo.login(email, password)
                _state.value = SessionState(user = user)
                syncManager.syncNow()
            } catch (e: AppException) {
                _state.value = _state.value.copy(loading = false, error = e)
            }
        }
    }

    fun logout() {
        repo.logout()
        _state.value = SessionState(user = null)
    }
}
