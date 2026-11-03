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
    val overheadCost: String? = null,
    val notes: String? = null,
) {
    val isComplete: Boolean get() = deviceCount >= expectedCount
    /** `yyyy-MM-dd` slice of the ISO date for display. */
    val dateLabel: String get() = shipmentDate.substringBefore('T')
}

@Serializable
data class CreateShipmentBody(
    val supplierId: String,
    val shipmentDate: String,
    val expectedCount: Int,
    val overheadCost: Double? = null,
    val notes: String? = null,
)

@Serializable
data class UpdateShipmentBody(
    val shipmentDate: String? = null,
    val expectedCount: Int? = null,
    val overheadCost: Double? = null,
    val notes: String? = null,
)

@Serializable
data class RegisterDevicesBody(val devices: List<RegisterDeviceBody>)

@Serializable
data class RegisterDeviceBody(
    val imei: String,
    val modelId: String,
    val specs: Map<String, String>,
    val acquisitionCost: Double,
    val targetPrice: Double? = null,
    val imei2: String? = null,
)

@Serializable
data class RegisteredDeviceDto(
    val id: String,
    val imei: String,
    val modelId: String,
    val statusCode: String,
    val landedCost: String? = null,
)

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
) {
    val label: String get() = "$brand $name"
}

@Serializable
data class DeviceRowDto(
    val id: String,
    val imei: String,
    val modelId: String,
    val statusCode: String,
    val landedCost: String? = null,
    val imei2: String? = null,
)

@Serializable
data class PaginatedDevicesDto(
    val items: List<DeviceRowDto> = emptyList(),
    val total: Int = 0,
)

/** One unit staged in the intake loop before the batch is POSTed. */
data class IntakeDraft(
    val imei: String,
    val modelId: String,
    val specs: Map<String, String>,
    val acquisitionCost: Double,
    val targetPrice: Double?,
    val imei2: String? = null,
) {
    fun toBody() = RegisterDeviceBody(imei, modelId, specs, acquisitionCost, targetPrice, imei2)
}
