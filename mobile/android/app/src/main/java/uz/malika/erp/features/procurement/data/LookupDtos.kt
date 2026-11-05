package uz.malika.erp.features.procurement.data

import kotlinx.serialization.Serializable

/**
 * Device-code lookup for intake (ADR 0031): `GET /lookup?code=` names what the
 * free reference lists know about a typed/scanned IMEI or Apple box code, and —
 * when it can — which of our catalog products it is, with that product's own
 * storage/colour option to pre-fill. `POST /lookup/links` teaches the link.
 */
@Serializable
data class CodeLookupResultDto(
    val source: LookupSourceDto = LookupSourceDto(),
    val reference: LookupReferenceDto = LookupReferenceDto(),
    val product: LookupProductDto? = null,
)

@Serializable
data class LookupSourceDto(val name: String = "", val license: String = "")

@Serializable
data class LookupReferenceDto(
    val brand: String = "",
    val model: String = "",
    val color: String? = null,
    val storage: String? = null,
    val ram: String? = null,
) {
    val label: String get() = "$brand $model".trim()
}

@Serializable
data class LookupProductDto(
    val modelId: String,
    val brand: String = "",
    val name: String = "",
    val kindCode: String = "IMEI",
    val matchedBy: String = "",
    val storageOption: String? = null,
    val colorOption: String? = null,
) {
    val label: String get() = "$brand $name".trim()
}

/** Teach which of our products a reference brand+model is. */
@Serializable
data class LearnLinkBody(val refBrand: String, val refModel: String, val modelId: String)
