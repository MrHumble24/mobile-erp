package uz.malika.erp.data.remote

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

// ── Auth ────────────────────────────────────────────────────────────────────

@Serializable
data class LoginRequest(val email: String, val password: String)

/** `/auth/login` returns a bare access token (no refresh) + the user. */
@Serializable
data class LoginResponse(val accessToken: String, val user: AuthUserDto)

@Serializable
data class AuthUserDto(
    val id: String,
    val email: String,
    val profile: AuthProfileDto? = null,
    val roles: List<String> = emptyList(),
    val permissions: List<String> = emptyList(),
)

@Serializable
data class AuthProfileDto(val fullName: String = "", val phone: String? = null)

// ── Sync: changes (pull) ──────────────────────────────────────────────────────

/** One page of `GET /sync/changes`. `nextSince == null` means fully drained. */
@Serializable
data class ChangesResponse(
    val nextSince: String? = null,
    val devices: List<DeviceSyncDto> = emptyList(),
    val partners: List<PartnerSyncDto> = emptyList(),
    /** QUANTITY products with their current stock (ADR 0030); full list each sync. */
    val products: List<ProductSyncDto> = emptyList(),
)

/** One quantity product an offline till can sell (ADR 0030). */
@Serializable
data class ProductSyncDto(
    val modelId: String,
    val brand: String = "",
    val name: String = "",
    val barcode: String? = null,
    val salePrice: JsonElement? = null,
    val quantity: Int = 0,
    // For the offline till grid (ADR 0031).
    val categoryId: String? = null,
    val imageUrl: String? = null,
    /** Resolved list prices per level (ADR 0034), so an offline till can switch level. */
    val prices: Map<String, String?>? = null,
)

/**
 * Cost fields (acquisitionCost, landedCost, …) are absent from the feed for
 * under-privileged users and are never cached — so they are simply not modelled.
 */
@Serializable
data class DeviceSyncDto(
    val id: String,
    val imei: String? = null,
    val imei2: String? = null,
    val serialNumber: String? = null,
    val statusCode: String,
    val version: Int,
    val targetPrice: JsonElement? = null,
    val specs: JsonElement? = null,
    val model: ModelDto? = null,
    val latestInspection: InspectionDto? = null,
    val latestSale: JsonElement? = null,
    val updatedAt: String,
    /** Resolved list prices per level (ADR 0034), resolved for this unit's storage. */
    val prices: Map<String, String?>? = null,
)

@Serializable
data class ModelDto(
    val id: String = "",
    val brand: String = "",
    val name: String = "",
    val kindCode: String? = null,
    // For the offline till grid (ADR 0031).
    val categoryId: String? = null,
    val imageUrl: String? = null,
)

@Serializable
data class InspectionDto(val gradeCode: String? = null, val notes: String? = null)

@Serializable
data class PartnerSyncDto(
    val id: String,
    val shopName: String,
    val phone: String? = null,
    val creditLimit: JsonElement? = null,
    val outstanding: JsonElement? = null,
)

// ── Sync: push (outbox drain) ─────────────────────────────────────────────────

@Serializable
data class PushRequest(val terminalId: String, val mutations: List<PushMutation>)

@Serializable
data class PushMutation(
    val id: String,
    val type: String,
    val payload: JsonElement,
    val baseVersion: Int? = null,
    val occurredAt: String,
)

@Serializable
data class PushResponse(val results: List<PushResult> = emptyList())

@Serializable
data class PushResult(
    val id: String,
    val status: String? = null,
    val conflictId: String? = null,
    val error: String? = null,
)

@Serializable
data class ResolveConflictRequest(val resolution: String, val note: String? = null)
