package uz.malika.erp.features.auth.data

import uz.malika.erp.data.remote.AuthUserDto

data class UserStore(val id: String, val name: String)

/**
 * The signed-in user (domain shape). Permission CODES — never role names —
 * drive all gating. Mapped from the transport [AuthUserDto].
 */
data class AuthUser(
    val id: String,
    val email: String,
    val fullName: String?,
    val roles: List<String>,
    val permissions: List<String>,
    val stores: List<UserStore> = emptyList(),
) {
    /** The single permission check. Checks codes, like the web `hasPermission`. */
    fun can(code: String): Boolean = permissions.contains(code)
}

fun AuthUserDto.toDomain() = AuthUser(
    id = id,
    email = email,
    fullName = profile?.fullName,
    roles = roles,
    permissions = permissions,
    stores = stores.map { UserStore(it.id, it.name) },
)
