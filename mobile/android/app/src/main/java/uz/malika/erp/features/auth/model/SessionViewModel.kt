package uz.malika.erp.features.auth.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.StoreEvents
import uz.malika.erp.core.StoreManager
import uz.malika.erp.core.logging.AppLog
import uz.malika.erp.data.sync.SyncManager
import uz.malika.erp.features.auth.data.AuthRepository
import uz.malika.erp.features.auth.data.AuthUser
import uz.malika.erp.i18n.I18n
import uz.malika.erp.i18n.LocaleStore
import uz.malika.erp.shared.ui.Toaster

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
    private val storeManager: StoreManager? = null,
    private val storeEvents: StoreEvents? = null,
    private val toaster: Toaster? = null,
    private val i18n: I18n? = null,
    private val localeStore: LocaleStore? = null,
) : ViewModel() {

    private val _state = MutableStateFlow(SessionState(user = repo.cachedUser()))
    val state: StateFlow<SessionState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            authEvents.unauthorized.collect {
                AppLog.i("auth", "session cleared (401 auto-logout)")
                storeManager?.clear()
                _state.value = SessionState(user = null)
            }
        }
        storeEvents?.let { events ->
            viewModelScope.launch {
                events.storeRequired.collect {
                    AppLog.w("store", "refusal STORE_REQUIRED")
                    showStoreMessage("stores.storeRequired")
                    storeManager?.clear()
                }
            }
            viewModelScope.launch {
                events.storeForbidden.collect {
                    AppLog.w("store", "refusal STORE_FORBIDDEN")
                    showStoreMessage("stores.storeForbidden")
                    storeManager?.clear()
                    refreshPermissions()
                }
            }
        }
        _state.value.user?.let { user ->
            storeManager?.syncWithUser(user)
            syncManager.syncNow() // hydrate on restored session
            if (user.stores.isEmpty()) {
                refreshPermissions()
            }
        }
    }

    private fun showStoreMessage(key: String) {
        val loc = localeStore?.locale?.value ?: "uz"
        val msg = i18n?.t(loc, key, null) ?: key
        toaster?.error(msg)
    }

    fun login(email: String, password: String) {
        if (_state.value.loading) return
        _state.value = _state.value.copy(loading = true, error = null)
        viewModelScope.launch {
            try {
                val user = repo.login(email, password)
                AppLog.i("auth", "login ok: $email")
                storeManager?.syncWithUser(user)
                _state.value = SessionState(user = user)
                syncManager.syncNow()
            } catch (e: AppException) {
                AppLog.w("auth", "login failed ($email): ${e.statusCode} ${e.message}")
                _state.value = _state.value.copy(loading = false, error = e)
            }
        }
    }

    /**
     * Re-read the signed-in user from the server so newly granted/revoked
     * permissions and store assignments apply without signing out.
     */
    fun refreshPermissions() {
        if (_state.value.user == null) return
        viewModelScope.launch {
            runCatching { repo.me() }.getOrNull()?.let { fresh ->
                if (_state.value.user != null) {
                    _state.value = _state.value.copy(user = fresh)
                    storeManager?.syncWithUser(fresh)
                }
            }
        }
    }

    fun logout() {
        AppLog.i("auth", "logout")
        storeManager?.clear()
        repo.logout()
        _state.value = SessionState(user = null)
    }
}
