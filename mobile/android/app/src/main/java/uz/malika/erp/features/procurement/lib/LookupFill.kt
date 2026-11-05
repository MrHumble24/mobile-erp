package uz.malika.erp.features.procurement.lib

/**
 * Fills the intake spec fields from a code lookup (ADR 0031): storage and colour
 * are set from the resolved product's options, but ONLY where the field is still
 * empty — what the person already typed is never overwritten. Pure, unit-tested.
 */
object LookupFill {
    fun fill(specs: Map<String, String>, storage: String?, color: String?): Map<String, String> {
        val out = specs.toMutableMap()
        fillIfEmpty(out, "storage", storage)
        fillIfEmpty(out, "color", color)
        return out
    }

    private fun fillIfEmpty(target: MutableMap<String, String>, key: String, value: String?) {
        val clean = value?.trim()
        if (!clean.isNullOrEmpty() && target[key].isNullOrBlank()) {
            target[key] = clean
        }
    }
}
