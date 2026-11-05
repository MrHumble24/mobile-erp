package uz.malika.erp.features.sales.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

// ── Response DTOs (ADR 0031) ───────────────────────────────────────────────────

@Serializable
data class CatalogEntryDto(
    val modelId: String,
    val brand: String = "",
    val name: String = "",
    val kindCode: String = "IMEI",
    val categoryId: String? = null,
    val categoryName: String? = null,
    val imageUrl: String? = null,
    val inStock: Int = 0,
    val minTargetPrice: String? = null,
    val maxTargetPrice: String? = null,
    val salePrice: String? = null,
)

@Serializable
data class CatalogUnitDto(
    val id: String,
    val code: String? = null,
    val specs: JsonElement? = null,
    val gradeCode: String? = null,
    val targetPrice: String? = null,
)

@Serializable
data class CatalogCategoryDto(val id: String, val name: String)

// ── Domain ──────────────────────────────────────────────────────────────────

/**
 * One product card on the till grid. A QUANTITY product shows [salePrice] per
 * piece; an IMEI/SERIAL product shows the min–max target-price range of its
 * in-stock units. [inStock] is the unit count (IMEI/SERIAL) or summed quantity.
 */
data class CatalogCard(
    val modelId: String,
    val brand: String,
    val name: String,
    val kindCode: String,
    val categoryId: String?,
    val categoryName: String?,
    val imageUrl: String?,
    val inStock: Int,
    val minTargetPrice: String?,
    val maxTargetPrice: String?,
    val salePrice: String?,
) {
    val label: String get() = "$brand $name".trim()
    val isQuantity: Boolean get() = kindCode == "QUANTITY"

    /** The CartProduct a QUANTITY card tap adds to the cart. */
    fun toCartProduct() = CartProduct(
        modelId = modelId, brand = brand, name = name,
        barcode = null, salePrice = salePrice, inStock = inStock,
    )

    companion object {
        fun fromDto(d: CatalogEntryDto) = CatalogCard(
            modelId = d.modelId, brand = d.brand, name = d.name, kindCode = d.kindCode,
            categoryId = d.categoryId, categoryName = d.categoryName, imageUrl = d.imageUrl,
            inStock = d.inStock, minTargetPrice = d.minTargetPrice,
            maxTargetPrice = d.maxTargetPrice, salePrice = d.salePrice,
        )
    }
}

/** One in-stock unit the seller picks after tapping an IMEI/SERIAL card. */
data class CatalogUnitItem(
    val id: String,
    val code: String,
    val specs: Map<String, String>,
    val gradeCode: String?,
    val targetPrice: String?,
) {
    val storage: String? get() = specs["storage"]?.takeIf { it.isNotBlank() }
    val color: String? get() = specs["color"]?.takeIf { it.isNotBlank() }

    companion object {
        fun fromDto(d: CatalogUnitDto) = CatalogUnitItem(
            id = d.id,
            code = d.code.orEmpty(),
            specs = specsToMap(d.specs),
            gradeCode = d.gradeCode,
            targetPrice = d.targetPrice,
        )
    }
}

/** Flatten a specs JSON object into a string map; non-object/empty → empty map. */
fun specsToMap(specs: JsonElement?): Map<String, String> {
    val obj = specs as? JsonObject ?: return emptyMap()
    return obj.mapNotNull { (k, v) ->
        (v as? JsonPrimitive)?.let { k to it.content }
    }.toMap()
}
