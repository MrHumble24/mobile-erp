package uz.malika.erp.i18n

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import uz.malika.erp.core.SecureStore

/**
 * The current UI locale. Client-only state, defaults to Uzbek, persisted across
 * restarts. Switching it re-provides [LocalT] so the whole tree re-translates.
 */
class LocaleStore(private val secure: SecureStore) {

    private val _locale = MutableStateFlow(secure.get(KEY) ?: DEFAULT_LOCALE)
    val locale: StateFlow<String> = _locale

    fun set(locale: String) {
        _locale.value = locale
        secure.put(KEY, locale)
    }

    private companion object {
        const val KEY = "ui_locale"
    }
}
