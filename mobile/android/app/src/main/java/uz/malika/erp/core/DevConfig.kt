package uz.malika.erp.core

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/** Which backend the app talks to. Switched from the dev panel. */
enum class AppEnv { PRODUCTION, DEVELOPMENT }

/** The active environment and the base URL for each. */
data class DevConfig(
    val env: AppEnv,
    val prodUrl: String,
    val devUrl: String,
) {
    /** The base URL the HTTP client should use right now. */
    val baseUrl: String get() = if (env == AppEnv.DEVELOPMENT) devUrl else prodUrl
}

/**
 * Runtime API configuration, persisted in [SecureStore]. The HTTP client reads
 * [currentBaseUrl] per request, so switching environment in the dev panel takes
 * effect immediately — no restart. Production defaults to [Config.DEFAULT_API_URL].
 */
class DevConfigStore(private val secure: SecureStore) {

    private val _state = MutableStateFlow(load())
    val state: StateFlow<DevConfig> = _state

    val currentBaseUrl: String get() = _state.value.baseUrl

    fun save(env: AppEnv, prodUrl: String, devUrl: String) {
        val next = DevConfig(env, prodUrl.trim(), devUrl.trim())
        secure.put(SecureStore.Keys.DEV_ENV, if (env == AppEnv.DEVELOPMENT) "development" else "production")
        secure.put(SecureStore.Keys.DEV_URL_PROD, next.prodUrl)
        secure.put(SecureStore.Keys.DEV_URL_DEV, next.devUrl)
        _state.value = next
    }

    private fun load(): DevConfig {
        val env = if (secure.get(SecureStore.Keys.DEV_ENV) == "development")
            AppEnv.DEVELOPMENT else AppEnv.PRODUCTION
        val prod = secure.get(SecureStore.Keys.DEV_URL_PROD)?.ifBlank { null } ?: Config.DEFAULT_API_URL
        val dev = secure.get(SecureStore.Keys.DEV_URL_DEV)?.ifBlank { null } ?: Config.DEFAULT_API_URL
        return DevConfig(env, prod, dev)
    }
}
