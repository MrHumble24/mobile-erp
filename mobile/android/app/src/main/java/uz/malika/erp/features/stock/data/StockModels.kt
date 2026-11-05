package uz.malika.erp.features.stock.data

import kotlinx.serialization.Serializable

/**
 * Transport + domain shapes for quantity-product stock (ADR 0030). Cost fields
 * (`averageCost`, `value`, a movement's `unitCostSnapshot`) are redaction-nullable:
 * the server sends them only with `device.cost.view`, so they are modelled
 * optional and their UI hides when absent.
 */

@Serializable
data class StockLevelDto(
    val modelId: String = "",
    val brand: String = "",
    val name: String = "",
    val barcode: String? = null,
    val modelCode: String? = null,
    val categoryId: String? = null,
    val salePrice: String? = null,
    val quantity: Int = 0,
    val averageCost: String? = null,
    val value: String? = null,
)

@Serializable
data class StockMovementDto(
    val id: String = "",
    val typeCode: String = "",
    val typeLabel: String = "",
    val quantity: Int = 0,
    val unitCostSnapshot: String? = null,
    val shipmentId: String? = null,
    val saleId: String? = null,
    val note: String? = null,
    val occurredAt: String? = null,
    val createdBy: MovementUserDto? = null,
)

@Serializable
data class MovementUserDto(val id: String = "", val name: String = "")

@Serializable
data class StockMovementsPageDto(
    val items: List<StockMovementDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 50,
)

@Serializable
data class StockCategoryDto(val id: String = "", val name: String = "")

/** The two stock corrections (ADR 0030). Neither moves money. */
@Serializable
data class AdjustStockBody(
    val modelId: String,
    val type: String,
    val quantity: Int? = null,
    val countedQuantity: Int? = null,
    val note: String? = null,
)

// ── Domain ─────────────────────────────────────────────────────────────────────

/** One quantity product with its current stock. */
data class StockLevel(
    val modelId: String,
    val brand: String,
    val name: String,
    val barcode: String?,
    val modelCode: String?,
    val categoryId: String?,
    val salePrice: String?,
    val quantity: Int,
    val averageCost: String?,
    val value: String?,
) {
    val label: String get() = "$brand $name".trim()
    val isZero: Boolean get() = quantity == 0
    val isBelowZero: Boolean get() = quantity < 0

    companion object {
        fun fromDto(d: StockLevelDto) = StockLevel(
            modelId = d.modelId,
            brand = d.brand,
            name = d.name,
            barcode = d.barcode,
            modelCode = d.modelCode,
            categoryId = d.categoryId,
            salePrice = d.salePrice,
            quantity = d.quantity,
            averageCost = d.averageCost,
            value = d.value,
        )
    }
}

/** One stock movement row (newest first). */
data class StockMovement(
    val id: String,
    val typeCode: String,
    val typeLabel: String,
    val quantity: Int,
    val unitCost: String?,
    val note: String?,
    val occurredAt: String?,
    val byName: String?,
) {
    companion object {
        fun fromDto(d: StockMovementDto) = StockMovement(
            id = d.id,
            typeCode = d.typeCode,
            typeLabel = d.typeLabel,
            quantity = d.quantity,
            unitCost = d.unitCostSnapshot,
            note = d.note,
            occurredAt = d.occurredAt,
            byName = d.createdBy?.name?.takeIf { it.isNotBlank() },
        )
    }
}

/** A product category option for the stock filter. */
data class StockCategory(val id: String, val name: String) {
    companion object {
        fun fromDto(d: StockCategoryDto) = StockCategory(d.id, d.name)
    }
}

/** Pure stock arithmetic shown in the UI (the server is authoritative). */
object StockMath {
    /** The signed change a count correction writes: counted − current (ADR 0030). */
    fun countDifference(current: Int, counted: Int): Int = counted - current
}
