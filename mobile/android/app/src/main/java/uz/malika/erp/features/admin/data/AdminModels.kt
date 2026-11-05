package uz.malika.erp.features.admin.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.jsonPrimitive

/**
 * Transport shapes for the Admin & Sync slice (`/users`, `/access`, `/settings`).
 * These carry NO cost fields — the server never returns money on these projections.
 * The DTOs double as the slice's read models (plain data, no transport junk to map
 * away), matching the web `entities/user` and `entities/settings` types.
 */

// ── Users & RBAC reads ───────────────────────────────────────────────────────

@Serializable
data class ProfileDto(
    val firstName: String = "",
    val lastName: String? = null,
    val phone: String? = null,
    val telegramHandle: String? = null,
    val locale: String? = null,
) {
    val fullName: String
        get() = listOfNotNull(firstName.ifBlank { null }, lastName?.ifBlank { null })
            .joinToString(" ")
}

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val isActive: Boolean = true,
    val lastLoginAt: String? = null,
    val createdAt: String? = null,
    val profile: ProfileDto? = null,
    val roles: List<String> = emptyList(),
) {
    val displayName: String get() = profile?.fullName?.ifBlank { null } ?: email
}

@Serializable
data class PaginatedUsersDto(
    val items: List<UserDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 25,
)

@Serializable
data class UserStatsDto(
    val total: Int = 0,
    val active: Int = 0,
    val byRole: Map<String, Int> = emptyMap(),
)

@Serializable
data class RoleDto(
    val code: String,
    val name: String,
    val description: String? = null,
    val isSystem: Boolean = false,
    val permissionCodes: List<String> = emptyList(),
)

@Serializable
data class PermissionDto(
    val code: String,
    val resource: String = "",
    val action: String = "",
    val description: String? = null,
)

@Serializable
data class EffectiveOverrideDto(
    val permissionCode: String,
    val granted: Boolean,
    val reason: String? = null,
)

/** Which roles grant a given permission (web `breakdown.roleGrants`). */
@Serializable
data class RoleGrantDto(
    val permissionCode: String,
    val roleCodes: List<String> = emptyList(),
)

/** `GET /users/:id/effective-permissions`. */
@Serializable
data class EffectivePermsDto(
    val roles: List<String> = emptyList(),
    val roleGrants: List<RoleGrantDto> = emptyList(),
    val overrides: List<EffectiveOverrideDto> = emptyList(),
    val effective: List<String> = emptyList(),
)

// ── Settings read ─────────────────────────────────────────────────────────────

@Serializable
data class StoreSettingsDto(
    val storeName: String? = null,
    val storeAddress: String? = null,
    val storePhone: String? = null,
    val receiptFooter: String? = null,
    val telegramChatId: String? = null,
    val closingTime: String = "20:00",
    val defaultWarrantyDays: Int = 0,
    val minMarginPercent: JsonElement? = null,
    val lowStockThreshold: Int = 0,
    val defaultNasiyaDueDays: Int = 0,
    val overdueReminderDays: Int = 0,
    // Discounts (Change 7/12, ADR 0034).
    val discountsEnabled: Boolean = false,
    val discountPercentAllowed: Boolean = true,
    val discountAmountAllowed: Boolean = true,
    val discountPresetsPercent: List<Double> = emptyList(),
    val discountPresetsAmount: List<Double> = emptyList(),
    val maxDiscountPercent: JsonElement? = null,
    // Customer credit (ADR 0035) and shifts (ADR 0036).
    val customerCreditEnabled: Boolean = false,
    val defaultCreditLimit: JsonElement? = null,
    val shiftsEnabled: Boolean = false,
    // Repairs (Change 13, ADR 0040).
    val repairsEnabled: Boolean = false,
) {
    /** Decimal arrives as a JSON number or string; keep it as a plain string. */
    val minMarginPercentStr: String
        get() = minMarginPercent?.jsonPrimitive?.content ?: "0"

    val maxDiscountPercentStr: String
        get() = maxDiscountPercent?.jsonPrimitive?.content ?: "0"

    /** The default credit limit as a plain string; "" when null (no cap). */
    val defaultCreditLimitStr: String
        get() = defaultCreditLimit?.takeIf { it.toString() != "null" }?.jsonPrimitive?.content ?: ""
}

// ── Write bodies ──────────────────────────────────────────────────────────────

@Serializable
data class ProfileBody(
    val firstName: String,
    val lastName: String? = null,
    val phone: String? = null,
    val telegramHandle: String? = null,
    val locale: String? = null,
)

@Serializable
data class CreateUserBody(
    val email: String,
    val password: String,
    val profile: ProfileBody,
    val roleCodes: List<String>,
)

@Serializable
data class UpdateUserBody(
    val profile: ProfileBody? = null,
    val isActive: Boolean? = null,
)

@Serializable
data class SetRolesBody(val roleCodes: List<String>)

@Serializable
data class OverrideBody(val permissionCode: String, val granted: Boolean)

@Serializable
data class SetPermissionsBody(val overrides: List<OverrideBody>)

@Serializable
data class ResetPasswordBody(val password: String)

@Serializable
data class CreateRoleBody(val code: String, val name: String, val description: String? = null)

@Serializable
data class UpdateRoleBody(val name: String? = null, val description: String? = null)

@Serializable
data class SetRolePermsBody(val permissionCodes: List<String>)
