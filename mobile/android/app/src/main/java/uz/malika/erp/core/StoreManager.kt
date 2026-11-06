package uz.malika.erp.core

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import uz.malika.erp.features.auth.data.AuthUser
import uz.malika.erp.features.auth.data.UserStore

/**
 * Manages the active store selection (ADR 0058).
 * Rules:
 *  - 1 store: chosen automatically without asking.
 *  - Several stores and none saved (or saved store no longer in list): null (prompt user).
 *  - Several stores and saved store valid: kept across app restarts.
 *  - Signing out clears it.
 */
class StoreManager(private val secure: SecureStore) {

    private val _activeStoreId = MutableStateFlow<String?>(
        secure.get(SecureStore.Keys.ACTIVE_STORE_ID),
    )
    val activeStoreId: StateFlow<String?> = _activeStoreId.asStateFlow()

    fun get(): String? = _activeStoreId.value

    fun setActiveStoreId(id: String?) {
        if (id != null) {
            secure.put(SecureStore.Keys.ACTIVE_STORE_ID, id)
        } else {
            secure.remove(SecureStore.Keys.ACTIVE_STORE_ID)
        }
        _activeStoreId.value = id
    }

    /**
     * Resolves and updates the active store given the current user and saved state.
     * Returns the active store id, or null if the user must choose.
     */
    fun syncWithUser(user: AuthUser?): String? {
        if (user == null) {
            setActiveStoreId(null)
            return null
        }
        val saved = secure.get(SecureStore.Keys.ACTIVE_STORE_ID)
        val resolved = resolveActiveStore(user.stores, saved)
        if (resolved != saved) {
            setActiveStoreId(resolved)
        } else {
            _activeStoreId.value = resolved
        }
        return resolved
    }

    fun clear() {
        setActiveStoreId(null)
    }

    companion object {
        /**
         * Pure logic for active store resolution (Item 2).
         * - 1 store: chosen without asking.
         * - Several and saved valid: use saved.
         * - Several and none saved / saved gone: null.
         * - Empty: null.
         */
        fun resolveActiveStore(stores: List<UserStore>, savedStoreId: String?): String? {
            if (stores.size == 1) return stores[0].id
            if (stores.size > 1) {
                if (savedStoreId != null && stores.any { it.id == savedStoreId }) {
                    return savedStoreId
                }
                return null
            }
            return null
        }
    }
}
