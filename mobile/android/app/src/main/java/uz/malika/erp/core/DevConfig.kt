package uz.malika.erp.core

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import uz.malika.erp.core.logging.AppLog

/** Which backend the app talks to. Switched from the Developer Console. */
enum class AppEnv { PRODUCTION, STAGING, DEVELOPMENT }

/**
 * The active environment plus any per-environment URL overrides the user typed.
 * An absent override means "use the auto/default URL" for that env.
 */
data class DevConfig(
    val env: AppEnv,
    val overrides: Map<AppEnv, String>,
)

/**
 * Runtime API configuration, persisted in [SecureStore]. The HTTP client reads
 * [currentBaseUrl] per request, so a URL edit or env switch applies immediately —
 * no restart. Defaults: Production [Config.PROD_URL], Staging [Config.STAGING_URL]
 * (empty until a server exists), Development the auto URL from [DevHost].
 */
class DevConfigStore(
    private val secure: SecureStore,
    private val autoDevUrl: String = DevHost.autoDevUrl(),
) {
    private val _state = MutableStateFlow(load())
    val state: StateFlow<DevConfig> = _state

    val currentBaseUrl: String get() = effectiveUrl(_state.value.env)

    /** The auto/default URL for an env, ignoring any override. */
    fun defaultUrl(env: AppEnv): String = when (env) {
        AppEnv.PRODUCTION -> Config.PROD_URL
        AppEnv.STAGING -> Config.STAGING_URL
        AppEnv.DEVELOPMENT -> autoDevUrl
    }

    /** The URL actually used for an env: the user's override, else the default. */
    fun effectiveUrl(env: AppEnv): String = _state.value.overrides[env] ?: defaultUrl(env)

    /** Whether the user has overridden an env's URL. */
    fun isOverridden(env: AppEnv): Boolean = _state.value.overrides.containsKey(env)

    /** Switch the active environment. Callers clear the session (token is per-env). */
    fun setEnv(env: AppEnv) {
        secure.put(SecureStore.Keys.DEV_ENV, env.name)
        _state.value = _state.value.copy(env = env)
        AppLog.i("env", "switched to $env (${effectiveUrl(env)})")
    }

    /** Override an env's URL (blank resets to auto/default). Applies live. */
    fun setOverride(env: AppEnv, url: String) {
        val trimmed = url.trim()
        if (trimmed.isEmpty()) {
            resetOverride(env)
            return
        }
        secure.put(overrideKey(env), trimmed)
        _state.value = _state.value.copy(overrides = _state.value.overrides + (env to trimmed))
        AppLog.i("env", "override $env = $trimmed")
    }

    /** Drop an env's override, reverting to the auto/default URL. */
    fun resetOverride(env: AppEnv) {
        secure.remove(overrideKey(env))
        _state.value = _state.value.copy(overrides = _state.value.overrides - env)
        AppLog.i("env", "reset $env to default")
    }

    private fun overrideKey(env: AppEnv): String = when (env) {
        AppEnv.PRODUCTION -> SecureStore.Keys.DEV_OVERRIDE_PROD
        AppEnv.STAGING -> SecureStore.Keys.DEV_OVERRIDE_STAGING
        AppEnv.DEVELOPMENT -> SecureStore.Keys.DEV_OVERRIDE_DEV
    }

    private fun load(): DevConfig {
        val env = runCatching { AppEnv.valueOf(secure.get(SecureStore.Keys.DEV_ENV) ?: "") }
            .getOrDefault(AppEnv.PRODUCTION)
        val overrides = buildMap {
            AppEnv.entries.forEach { e ->
                secure.get(overrideKey(e))?.takeIf { it.isNotBlank() }?.let { put(e, it) }
            }
        }
        return DevConfig(env, overrides)
    }
}
