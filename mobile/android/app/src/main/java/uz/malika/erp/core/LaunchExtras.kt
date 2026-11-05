package uz.malika.erp.core

import android.content.Intent

/**
 * Debug-only launch extras for driving the app from `adb shell am start`:
 * ```
 * --es devHost 127.0.0.1   select Development with this host override
 * --es devEmail <email>    sign in through the real login path
 * --es devPassword <pw>    (never logged)
 * --es open <route>        navigate to a feature route after sign-in
 * ```
 * Each extra is optional and independent. [parse] is pure (unit-tested); the
 * caller reads them only under `BuildConfig.DEBUG`, so a release build ignores
 * them entirely. The host selects Development with a URL override; the email +
 * password go through the app's one login path; `open` navigates once signed in.
 */
data class LaunchExtras(
    val host: String? = null,
    val email: String? = null,
    val password: String? = null,
    val open: String? = null,
) {
    /** Whether email + password are both present, so the caller can sign in. */
    val canSignIn: Boolean get() = email != null && password != null

    companion object {
        fun parse(get: (String) -> String?): LaunchExtras? {
            val host = get("devHost")?.trim()?.ifBlank { null }
            val email = get("devEmail")?.trim()?.ifBlank { null }
            // A password is used verbatim — never trimmed (it may hold spaces), never logged.
            val password = get("devPassword")?.ifBlank { null }
            val open = get("open")?.trim()?.ifBlank { null }
            if (host == null && email == null && password == null && open == null) return null
            return LaunchExtras(host, email, password, open)
        }

        fun fromIntent(intent: Intent?): LaunchExtras? =
            intent?.let { i -> parse { key -> i.getStringExtra(key) } }
    }
}
