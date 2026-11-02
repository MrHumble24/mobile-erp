package uz.malika.erp.features.procurement.lib

import uz.malika.erp.features.procurement.data.AttributeDefDto

/** Server rule (RegisterDeviceDto): IMEI is exactly 15 digits. */
private val IMEI = Regex("^\\d{15}$")

/** Server rule (lookup codes): UPPER_SNAKE_CASE. */
private val LOOKUP_CODE = Regex("^[A-Z][A-Z0-9_]*$")

fun isValidImei(raw: String): Boolean = IMEI.matches(raw.trim())

fun isValidLookupCode(raw: String): Boolean = LOOKUP_CODE.matches(raw.trim())

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
): String? {
    if (!isValidImei(imei)) return "shipments.imeiLength"
    if (!modelSelected) return "shipments.selectModel"
    if (acquisitionCost == null || acquisitionCost < 0) return "shipments.acquisitionCost"
    val missingSpec = requiredSpecs.any { it.required && specs[it.key].isNullOrBlank() }
    if (missingSpec) return "shipments.invalidSpecs"
    return null
}
