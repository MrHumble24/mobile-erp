package uz.malika.erp.features.nasiya.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

/**
 * Transport shapes for `/partners/…` and `/consignments/…`, mirroring the
 * server views. Money arrives as a Prisma `Decimal` (string or number), so it
 * is read as a [JsonElement] and flattened with [money] — never a float.
 * Dates stay ISO strings (parsed only where day maths is needed; see model/).
 */

/** A JSON scalar (string or number) as its bare string; "0" for null. */
fun JsonElement?.money(): String =
    (this as? JsonPrimitive)?.takeUnless { it is JsonNull }?.content ?: "0"

// ── partner ledger + aging (GET) ──────────────────────────────────────────

@Serializable
data class LedgerEntryDto(
    val at: String,
    val kind: String, // "consignment" | "payment"
    val refId: String,
    val change: JsonElement? = null,
    val runningBalance: JsonElement? = null,
    val statusCode: String? = null,
    val notes: String? = null,
)

@Serializable
data class AgingBucketDto(
    val bucket: String, // current | d1_30 | d31_60 | d61_90 | d90_plus
    val count: Int = 0,
    val amount: JsonElement? = null,
)

/**
 * Full partner row (`GET /partners/:id`). Needed to pre-fill the edit sheet —
 * the local mirror only carries shopName/phone/limit/outstanding, so editing
 * from the mirror alone would blank contact/telegram/notes/isActive on PATCH.
 */
@Serializable
data class PartnerDetailDto(
    val id: String,
    val shopName: String,
    val contactPerson: String? = null,
    val phone: String? = null,
    val telegramHandle: String? = null,
    val creditLimit: JsonElement? = null,
    val notes: String? = null,
    val isActive: Boolean = true,
    val outstanding: JsonElement? = null,
)

/**
 * A `GET /partners` list row. The online directory carries `isActive` and
 * `overdueCount` (the facets the local mirror lacks), but no cost fields. Maps
 * into the mirror's [uz.malika.erp.data.local.PartnerEntity] so one card renders
 * both sources.
 */
@Serializable
data class PartnerListDto(
    val id: String,
    val shopName: String,
    val phone: String? = null,
    val creditLimit: JsonElement? = null,
    val outstanding: JsonElement? = null,
    val isActive: Boolean = true,
    val overdueCount: Int = 0,
)

fun PartnerListDto.toEntity(): uz.malika.erp.data.local.PartnerEntity =
    uz.malika.erp.data.local.PartnerEntity(
        id = id,
        shopName = shopName,
        phone = phone,
        creditLimit = creditLimit.money(),
        outstanding = outstanding.money(),
    )

// ── partner writes (online) ───────────────────────────────────────────────

@Serializable
data class CreatePartnerBody(
    val shopName: String,
    val contactPerson: String? = null,
    val phone: String? = null,
    val telegramHandle: String? = null,
    val creditLimit: Double? = null,
    val notes: String? = null,
)

@Serializable
data class UpdatePartnerBody(
    val shopName: String? = null,
    val contactPerson: String? = null,
    val phone: String? = null,
    val telegramHandle: String? = null,
    val creditLimit: Double? = null,
    val notes: String? = null,
    val isActive: Boolean? = null,
)

@Serializable
data class RecordPaymentBody(
    val amount: Double,
    val consignmentId: String? = null,
    val paidAt: String? = null,
    val notes: String? = null,
)

// ── consignment reads ──────────────────────────────────────────────────────

@Serializable
data class ConsignmentViewDto(
    val id: String,
    val partnerId: String,
    val partnerShopName: String = "",
    val deviceId: String = "",
    val imei: String,
    val agreedPrice: JsonElement? = null,
    val dueDate: String,
    val statusCode: String,
    val consignedAt: String,
    val resolvedAt: String? = null,
    val notes: String? = null,
    val saleId: String? = null,
)

@Serializable
data class ConsignmentPageDto(
    val items: List<ConsignmentViewDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 25,
)

@Serializable
data class ConsignmentStatsDto(
    val total: Int = 0,
    val openCount: Int = 0,
    val overdueCount: Int = 0,
    val outstanding: JsonElement? = null,
)

// ── consignment write bodies (REST fast-path) ──────────────────────────────

@Serializable
data class CreateConsignmentBody(
    val imei: String,
    val partnerId: String,
    val agreedPrice: Double,
    val dueDate: String,
    val notes: String? = null,
    val clientMutationId: String? = null,
)

@Serializable
data class SettleBody(
    val salePrice: Double? = null,
    val notes: String? = null,
)

@Serializable
data class ReturnBody(
    val reason: String? = null,
    val condition: String? = null, // IN_STOCK | DEFECTIVE
)
