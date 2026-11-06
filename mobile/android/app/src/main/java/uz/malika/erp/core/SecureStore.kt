package uz.malika.erp.core

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * The one secure-storage configuration (Keystore-backed EncryptedSharedPreferences).
 * Holds the 12h JWT, the cached user JSON, the terminal id, and the dev-panel
 * API config. Everything secret goes through here. Synchronous by design — the
 * values are tiny and read rarely (login/startup/per-request token).
 */
class SecureStore(context: Context) {

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "malika_secure",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    fun get(key: String): String? = prefs.getString(key, null)

    fun put(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }

    fun remove(vararg keys: String) {
        prefs.edit().apply { keys.forEach { remove(it) } }.apply()
    }

    object Keys {
        const val TOKEN = "auth_token"
        const val USER = "auth_user"
        const val ACTIVE_STORE_ID = "active_store_id"
        const val TERMINAL_ID = "terminal_id"
        const val DEV_ENV = "dev_env"
        const val DEV_OVERRIDE_PROD = "dev_override_prod"
        const val DEV_OVERRIDE_STAGING = "dev_override_staging"
        const val DEV_OVERRIDE_DEV = "dev_override_dev"
    }
}
