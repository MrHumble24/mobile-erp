package uz.malika.erp.features.orders.lib

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull

/**
 * The storefront variant line (storage, color, …) as one string, mirroring the
 * website: every spec value joined with " · ", blanks dropped. Null when empty.
 */
fun orderSpecLine(specs: JsonObject?): String? {
    if (specs == null) return null
    val parts = specs.values
        .mapNotNull { (it as? JsonPrimitive)?.contentOrNull }
        .filter { it.isNotBlank() }
    return parts.joinToString(" · ").ifBlank { null }
}
