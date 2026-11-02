package uz.malika.erp.features.admin.data

import uz.malika.erp.core.runApi

/**
 * The only place that talks to `/users` and `/access`. Plain suspend functions
 * wrapped in [runApi] so callers see a normalized `AppException`. Returns the
 * transport DTOs directly (they are already clean read models).
 */
class UsersRepository(private val api: AdminApi) {

    suspend fun listUsers(
        search: String?,
        role: String?,
        active: Boolean?,
        page: Int = 1,
        pageSize: Int = 100,
    ): PaginatedUsersDto = runApi {
        api.users(
            search = search?.ifBlank { null },
            role = role,
            active = active?.toString(),
            page = page,
            pageSize = pageSize,
        )
    }

    suspend fun stats(): UserStatsDto = runApi { api.userStats() }

    suspend fun effectivePermissions(id: String): EffectivePermsDto =
        runApi { api.effectivePermissions(id) }

    suspend fun createUser(body: CreateUserBody): UserDto = runApi { api.createUser(body) }

    suspend fun setActive(id: String, isActive: Boolean): UserDto =
        runApi { api.updateUser(id, UpdateUserBody(isActive = isActive)) }

    suspend fun updateProfile(id: String, profile: ProfileBody): UserDto =
        runApi { api.updateUser(id, UpdateUserBody(profile = profile)) }

    suspend fun setRoles(id: String, roleCodes: List<String>): UserDto =
        runApi { api.setRoles(id, SetRolesBody(roleCodes)) }

    suspend fun setPermissions(id: String, overrides: List<OverrideBody>): UserDto =
        runApi { api.setPermissions(id, SetPermissionsBody(overrides)) }

    suspend fun resetPassword(id: String, password: String) =
        runApi { api.resetPassword(id, ResetPasswordBody(password)) }

    suspend fun listRoles(): List<RoleDto> = runApi { api.roles() }

    suspend fun listPermissions(): List<PermissionDto> = runApi { api.permissions() }

    suspend fun createRole(code: String, name: String, description: String?): RoleDto =
        runApi { api.createRole(CreateRoleBody(code, name, description?.ifBlank { null })) }

    suspend fun renameRole(code: String, name: String, description: String?): RoleDto =
        runApi { api.renameRole(code, UpdateRoleBody(name, description?.ifBlank { null })) }

    suspend fun setRolePermissions(code: String, permissionCodes: List<String>): RoleDto =
        runApi { api.setRolePermissions(code, SetRolePermsBody(permissionCodes)) }

    suspend fun deleteRole(code: String) = runApi { api.deleteRole(code) }
}
