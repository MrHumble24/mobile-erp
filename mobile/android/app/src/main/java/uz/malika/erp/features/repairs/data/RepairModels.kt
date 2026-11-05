package uz.malika.erp.features.repairs.data

import kotlinx.serialization.Serializable

/**
 * Repair tickets (Change 13, ADR 0040). Transport shapes for `/repairs`. All money
 * is a 2-dp string; cost figures (partUnitCost, partLineCost, partsCost, outsideCost,
 * outsidePaid, profit) are null for a caller without `device.cost.view`. Customer-facing
 * money (agreedPrice, paid, outstanding, income) is always shown. Nothing derivable is
 * stored — the server computes it.
 */

@Serializable
data class RepairPerson(val id: String = "", val name: String = "")

@Serializable
data class RepairCustomerRef(val id: String = "", val name: String = "", val phone: String? = null)

/** Who repairs the phone: `kind` is OWN (userId+name) or OUTSIDE (name+phone); null = unset. */
@Serializable
data class RepairMasterDto(
    val kind: String = "",
    val userId: String? = null,
    val name: String = "",
    val phone: String? = null,
)

@Serializable
data class RepairPartDto(
    val id: String = "",
    val modelId: String = "",
    val name: String = "",
    val quantity: Int = 0,
    val partUnitCost: String? = null,
    val partLineCost: String? = null,
    val addedBy: RepairPerson = RepairPerson(),
    val createdAt: String = "",
)

@Serializable
data class RepairPaymentDto(
    val id: String = "",
    val accountCode: String = "",
    /** Signed: positive = payment in, negative = refund out. */
    val amount: String = "0",
    val occurredAt: String = "",
    val receivedBy: RepairPerson = RepairPerson(),
)

@Serializable
data class RepairStatusHistoryDto(
    val fromStatusCode: String? = null,
    val toStatusCode: String = "",
    val note: String? = null,
    val changedBy: RepairPerson = RepairPerson(),
    val changedAt: String = "",
)

@Serializable
data class RepairView(
    val id: String = "",
    val ticketNumber: Int = 0,
    val customer: RepairCustomerRef = RepairCustomerRef(),
    val deviceName: String = "",
    val modelId: String? = null,
    val model: String? = null,
    val imei: String? = null,
    val serialNumber: String? = null,
    val problem: String = "",
    val agreedPrice: String = "0",
    val warrantyDays: Int = 0,
    val notes: String? = null,
    val master: RepairMasterDto? = null,
    val outsideCost: String? = null,
    val statusCode: String = "",
    val statusLabel: String = "",
    val isTerminal: Boolean = false,
    val receivedBy: RepairPerson = RepairPerson(),
    val receivedAt: String = "",
    val createdAt: String = "",
    val updatedAt: String = "",
    val parts: List<RepairPartDto> = emptyList(),
    val payments: List<RepairPaymentDto> = emptyList(),
    val statusHistory: List<RepairStatusHistoryDto> = emptyList(),
    val paid: String = "0",
    val outstanding: String = "0",
    val partsCost: String? = null,
    val outsidePaid: String? = null,
    val profit: String? = null,
    val givenBackAt: String? = null,
    val warrantyUntil: String? = null,
    val underWarranty: Boolean = false,
)

@Serializable
data class RepairListItem(
    val id: String = "",
    val ticketNumber: Int = 0,
    val customer: RepairCustomerRef = RepairCustomerRef(),
    val deviceName: String = "",
    val imei: String? = null,
    val statusCode: String = "",
    val statusLabel: String = "",
    val isTerminal: Boolean = false,
    val agreedPrice: String = "0",
    val paid: String = "0",
    val outstanding: String = "0",
    val receivedAt: String = "",
    val warrantyUntil: String? = null,
    val underWarranty: Boolean = false,
)

@Serializable
data class RepairPage(
    val items: List<RepairListItem> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 20,
)

@Serializable
data class RepairReport(
    val from: String? = null,
    val to: String? = null,
    val income: String = "0",
    val partsCost: String? = null,
    val outsideCost: String? = null,
    val profit: String? = null,
)
