package uz.malika.erp.features.procurement.lib

import uz.malika.erp.features.procurement.data.AttributeDefDto

/** Server rule (RegisterDeviceDto): IMEI is exactly 15 digits. */
private val IMEI = Regex("^\\d{15}$")

/** Server rule (lookup codes): UPPER_SNAKE_CASE. */
private val LOOKUP_CODE = Regex("^[A-Z][A-Z0-9_]*$")

fun isValidImei(raw: String): Boolean = IMEI.matches(raw.trim())

fun isValidLookupCode(raw: String): Boolean = LOOKUP_CODE.matches(raw.trim())

/**
 * True once every required IMEI slot of one unit is filled: IMEI 1 always, plus
 * IMEI 2 when Dual SIM is on. Shape only — the scan handler uses it to decide
 * whether to open the confirm sheet; full checks stay in [validateIntake].
 */
fun imeiSlotsFilled(imei1: String, imei2: String?, dualSim: Boolean): Boolean {
    if (imei1.isBlank()) return false
    return !dualSim || !imei2.isNullOrBlank()
}

/**
 * Validates one staged intake unit. Returns the i18n key of the first failure,
 * or null when the draft is valid. Pure — unit-tested in IntakeValidationTest.
 */
fun validateIntake(
    imei: String,
    modelSelected: Boolean,
    acquisitionCost: Double?,
    requiredSpecs: List<AttributeDefDto>,
    specs: Map<String, String>,
    imei2: String? = null,
    dualSim: Boolean = false,
): String? {
    if (!isValidImei(imei)) return "shipments.imeiLength"
    if (!modelSelected) return "shipments.selectModel"
    if (acquisitionCost == null || acquisitionCost < 0) return "shipments.acquisitionCost"
    val missingSpec = requiredSpecs.any { it.required && specs[it.key].isNullOrBlank() }
    if (missingSpec) return "shipments.invalidSpecs"
    // Dual-SIM is form state; a unit is dual-SIM iff imei2 is kept (derived, never stored).
    if (dualSim) {
        val second = imei2?.trim().orEmpty()
        if (second.isEmpty()) return "inventory.imei2Required"
        if (!isValidImei(second)) return "shipments.imeiLength"
        if (second == imei.trim()) return "inventory.imei2Mismatch"
    }
    return null
}
