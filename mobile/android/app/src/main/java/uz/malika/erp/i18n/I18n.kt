package uz.malika.erp.i18n

import android.content.res.AssetManager
import androidx.compose.runtime.staticCompositionLocalOf
import org.json.JSONObject

/**
 * i18n reads the web client's JSON straight from assets — the SINGLE source,
 * never copied by hand. The app module maps `client/src/shared/i18n` into its
 * assets (see app/build.gradle.kts), so files land at `<locale>/<namespace>.json`.
 *
 * Lookup key is `namespace.key`; `{param}` placeholders are interpolated; a
 * missing key falls back locale → uz → en → the raw key. Default locale is `uz`.
 */
private val NAMESPACES = listOf(
    "auth", "balance", "catalog", "common", "consignments", "customers", "customs", "dashboard",
    "expenses", "inventory", "nav", "partners", "pos", "pricing", "qc",
    "reports", "sales", "settings", "shipments", "users",
)
private val LOCALES = listOf("uz", "en")
const val DEFAULT_LOCALE = "uz"

/** locale → namespace → key → value. */
typealias Bundles = Map<String, Map<String, Map<String, String>>>

class I18n(private val bundles: Bundles) {

    fun t(locale: String, key: String, params: Map<String, Any?>? = null): String {
        val dot = key.indexOf('.')
        if (dot < 0) return key
        val ns = key.substring(0, dot)
        val name = key.substring(dot + 1)
        val text = bundles[locale]?.get(ns)?.get(name)
            ?: bundles[DEFAULT_LOCALE]?.get(ns)?.get(name)
            ?: bundles["en"]?.get(ns)?.get(name)
            ?: return key
        return interpolate(text, params)
    }

    private fun interpolate(text: String, params: Map<String, Any?>?): String {
        if (params.isNullOrEmpty()) return text
        var out = text
        params.forEach { (k, v) -> out = out.replace("{$k}", v?.toString() ?: "") }
        return out
    }

    companion object {
        fun load(assets: AssetManager): I18n {
            val bundles = LOCALES.associateWith { locale ->
                NAMESPACES.associateWith { ns -> readNamespace(assets, locale, ns) }
            }
            return I18n(bundles)
        }

        private fun readNamespace(
            assets: AssetManager,
            locale: String,
            ns: String,
        ): Map<String, String> = try {
            val raw = assets.open("$locale/$ns.json").bufferedReader().use { it.readText() }
            val json = JSONObject(raw)
            buildMap {
                json.keys().forEach { k -> put(k, json.getString(k)) }
            }
        } catch (_: Exception) {
            emptyMap()
        }
    }
}

/** A locale-bound translate function, provided by the app root. */
typealias Translate = (String, Map<String, Any?>?) -> String

val LocalT = staticCompositionLocalOf<Translate> {
    error("LocalT not provided")
}
