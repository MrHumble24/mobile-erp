package uz.malika.erp.features.admin.data

import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Retrofit interface for the admin endpoints the foundation `ApiService` does
 * not declare (`/users`, `/access`, `/settings`). Built via
 * `container.retrofit.create(AdminApi::class.java)` — the one shared HTTP
 * pipeline, so the base-URL switch and 401→logout still apply.
 */
interface AdminApi {

    @GET("users")
    suspend fun users(
        @Query("search") search: String?,
        @Query("role") role: String?,
        @Query("active") active: String?,
        @Query("page") page: Int,
        @Query("pageSize") pageSize: Int,
    ): PaginatedUsersDto

    @GET("users/stats")
    suspend fun userStats(): UserStatsDto

    @GET("users/{id}/effective-permissions")
    suspend fun effectivePermissions(@Path("id") id: String): EffectivePermsDto

    @POST("users")
    suspend fun createUser(@Body body: CreateUserBody): UserDto

    @PATCH("users/{id}")
    suspend fun updateUser(@Path("id") id: String, @Body body: UpdateUserBody): UserDto

    @POST("users/{id}/password")
    suspend fun resetPassword(@Path("id") id: String, @Body body: ResetPasswordBody)

    @PUT("users/{id}/roles")
    suspend fun setRoles(@Path("id") id: String, @Body body: SetRolesBody): UserDto

    @PUT("users/{id}/permissions")
    suspend fun setPermissions(@Path("id") id: String, @Body body: SetPermissionsBody): UserDto

    @GET("access/roles")
    suspend fun roles(): List<RoleDto>

    @GET("access/permissions")
    suspend fun permissions(): List<PermissionDto>

    @POST("access/roles")
    suspend fun createRole(@Body body: CreateRoleBody): RoleDto

    @PATCH("access/roles/{code}")
    suspend fun renameRole(@Path("code") code: String, @Body body: UpdateRoleBody): RoleDto

    @PUT("access/roles/{code}/permissions")
    suspend fun setRolePermissions(@Path("code") code: String, @Body body: SetRolePermsBody): RoleDto

    @DELETE("access/roles/{code}")
    suspend fun deleteRole(@Path("code") code: String)

    @GET("settings")
    suspend fun settings(): StoreSettingsDto

    @PUT("settings")
    suspend fun updateSettings(@Body body: JsonElement): StoreSettingsDto
}
