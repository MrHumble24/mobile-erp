package uz.malika.erp.features.procurement.data

import kotlinx.serialization.Serializable

/**
 * Transport + domain shapes for suppliers, shipments, device models and the
 * device rows an intake produces. Cost fields are redaction-nullable: the
 * server omits them for users without `device.cost.view`, so they are modelled
 * optional and their UI is hidden when absent (never cached, never required).
 */

@Serializable
data class SupplierDto(
    val id: String,
    val name: String,
    val country: String? = null,
    val contact: String? = null,
    val notes: String? = null,
    val isActive: Boolean = true,
)

/** Create or update a supplier; nulls are dropped by the client's Json config. */
@Serializable
data class SupplierBody(
    val name: String? = null,
    val country: String? = null,
    val contact: String? = null,
    val notes: String? = null,
    val isActive: Boolean? = null,
)

@Serializable
data class ShipmentDto(
    val id: String,
    val supplierId: String,
    val shipmentDate: String,
    val expectedCount: Int,
    val deviceCount: Int = 0,
    val notes: String? = null,
    /** Account the purchase + per-phone expense left from; fixed at creation. Optional so older rows decode. */
    val paymentAccountCode: String? = null,
    /** Sum of the shipment's phones' expenses; cost-redacted (absent without the cost permission). */
    val unitExpenseTotal: String? = null,
    /** Sum of the shipment's phones' customs fees; cost-redacted. */
    val customsFeeTotal: String? = null,
    /** How many of the shipment's phones still have a 0 customs fee (warn UI). */
    val devicesWithoutCustomsFee: Int = 0,
    /** Σ of the shipment's quantity PURCHASE lines; cost-redacted (ADR 0034). */
    val stockLinesTotal: String? = null,
    /** The shipment's quantity PURCHASE lines; present on `GET /shipments/:id` (ADR 0034). */
    val stockLines: List<ShipmentStockLineDto> = emptyList(),
) {
    val isComplete: Boolean get() = deviceCount >= expectedCount
    /** `yyyy-MM-dd` slice of the ISO date for display. */
    val dateLabel: String get() = shipmentDate.substringBefore('T')
}

/** One quantity PURCHASE line of a shipment (unitCost/lineTotal cost-redacted). */
@Serializable
data class ShipmentStockLineDto(
    val id: String = "",
    val modelId: String = "",
    val brand: String = "",
    val name: String = "",
    val quantity: Int = 0,
    val unitCost: String? = null,
    val lineTotal: String? = null,
    val occurredAt: String? = null,
) {
    val label: String get() = "$brand $name".trim()
}

@Serializable
data class CreateShipmentBody(
    val supplierId: String,
    val shipmentDate: String,
    val expectedCount: Int,
    val notes: String? = null,
    val paymentAccountCode: String? = null,
)

@Serializable
data class UpdateShipmentBody(
    val shipmentDate: String? = null,
    val expectedCount: Int? = null,
    val notes: String? = null,
)

@Serializable
data class RegisterDevicesBody(val devices: List<RegisterDeviceBody>)

/** One quantity purchase line: N pieces of a QUANTITY product at a unit cost (ADR 0030). */
@Serializable
data class PurchaseItemBody(val modelId: String, val quantity: Int, val unitCost: Double)

@Serializable
data class RegisterItemsBody(val items: List<PurchaseItemBody>)

/** Confirmation of one purchased quantity line (money left the shipment's account). */
@Serializable
data class PurchasedLineDto(val modelId: String = "", val quantity: Int = 0, val unitCost: String = "0")

@Serializable
data class RegisterDeviceBody(
    val imei: String? = null, // IMEI models; null for a serial unit (one of imei/serialNumber)
    val serialNumber: String? = null, // SERIAL models; null for a phone
    val modelId: String,
    val specs: Map<String, String>,
    val acquisitionCost: Double,
    val targetPrice: Double? = null,
    val imei2: String? = null,
    /** Per-phone expense at intake; a non-zero value needs `device.expense` (server 403s otherwise). */
    val unitExpense: Double? = null,
    val unitExpenseNote: String? = null,
)

@Serializable
data class RegisteredDeviceDto(
    val id: String,
    val imei: String? = null,
    val serialNumber: String? = null,
    val modelId: String,
    val statusCode: String,
    val landedCost: String? = null,
    /** Customs fee stamped by the server at intake; cost-redacted (null without the permission). */
    val customsFee: String? = null,
    val unitExpense: String? = null,
) {
    /** The unit's identifier — IMEI or serial number (ADR 0029). */
    val code: String get() = imei ?: serialNumber ?: ""
}

@Serializable
data class AttributeDefDto(
    val key: String,
    val label: String,
    val type: String,
    val options: List<String> = emptyList(),
    val required: Boolean = false,
)

@Serializable
data class DeviceModelDto(
    val id: String,
    val brand: String,
    val name: String,
    val attributes: List<AttributeDefDto> = emptyList(),
    val kindCode: String = "IMEI",
) {
    val label: String get() = "$brand $name"
    val isSerial: Boolean get() = kindCode == "SERIAL"
    val isQuantity: Boolean get() = kindCode == "QUANTITY"
}

@Serializable
data class DeviceRowDto(
    val id: String,
    val imei: String? = null,
    val serialNumber: String? = null,
    val modelId: String,
    val statusCode: String,
    val landedCost: String? = null,
    val imei2: String? = null,
) {
    /** The unit's identifier — IMEI or serial number (ADR 0029). */
    val code: String get() = imei ?: serialNumber ?: ""
}

@Serializable
data class PaginatedDevicesDto(
    val items: List<DeviceRowDto> = emptyList(),
    val total: Int = 0,
)

/**
 * One unit staged in the intake loop before the batch is POSTed. Exactly one of
 * [imei] / [serialNumber] is set, following the model's kind (ADR 0029).
 */
data class IntakeDraft(
    val imei: String? = null,
    val serialNumber: String? = null,
    val modelId: String,
    val specs: Map<String, String>,
    val acquisitionCost: Double,
    val targetPrice: Double?,
    val imei2: String? = null,
    val unitExpense: Double? = null,
    val unitExpenseNote: String? = null,
) {
    /** The code shown in the staged list — IMEI or serial number. */
    val code: String get() = imei ?: serialNumber ?: ""

    fun toBody() = RegisterDeviceBody(
        imei = imei,
        serialNumber = serialNumber,
        modelId = modelId,
        specs = specs,
        acquisitionCost = acquisitionCost,
        targetPrice = targetPrice,
        imei2 = imei2,
        unitExpense = unitExpense,
        unitExpenseNote = unitExpenseNote?.trim()?.ifBlank { null },
    )
}
