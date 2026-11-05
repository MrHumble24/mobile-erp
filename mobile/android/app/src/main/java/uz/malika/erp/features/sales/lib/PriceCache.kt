package uz.malika.erp.features.sales.lib

import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.nullable
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

/**
 * The resolved `{ RETAIL, WHOLESALE, PARTNER }` price map is cached on the device
 * and product rows as a JSON string so an offline till can still price every
 * level (ADR 0034). This is the one place that encodes/decodes that blob.
 */
object PriceCache {
    private val json = Json { ignoreUnknownKeys = true }
    private val serializer = MapSerializer(String.serializer(), String.serializer().nullable)

    fun parse(raw: String?): Map<String, String?>? =
        raw?.takeIf { it.isNotBlank() }?.let {
            runCatching { json.decodeFromString(serializer, it) }.getOrNull()
        }

    fun encode(prices: Map<String, String?>?): String? =
        prices?.takeIf { it.isNotEmpty() }?.let {
            runCatching { json.encodeToString(serializer, it) }.getOrNull()
        }
}
