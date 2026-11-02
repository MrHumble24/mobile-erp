package uz.malika.erp.features.auth.data

import kotlinx.serialization.json.Json
import uz.malika.erp.core.SecureStore
import uz.malika.erp.core.isJwtExpired
import uz.malika.erp.core.runApi
import uz.malika.erp.data.remote.ApiService
import uz.malika.erp.data.remote.AuthUserDto
import uz.malika.erp.data.remote.LoginRequest

/**
 * The only place that talks to the `/auth` endpoints. Owns persisting the token + cached
 * user. The HTTP client reads the token for each request; this restores the
 * cached user offline, rejecting an expired 12h token so it isn't treated as a
 * live session.
 */
class AuthRepository(
    private val api: ApiService,
    private val secure: SecureStore,
    private val json: Json,
) {
    suspend fun login(email: String, password: String): AuthUser = runApi {
        val result = api.login(LoginRequest(email, password))
        secure.put(SecureStore.Keys.TOKEN, result.accessToken)
        secure.put(SecureStore.Keys.USER, json.encodeToString(AuthUserDto.serializer(), result.user))
        result.user.toDomain()
    }

    suspend fun me(): AuthUser = runApi { api.me().toDomain() }

    /** The persisted session, or null when absent/expired. Pure-local, no network. */
    fun cachedUser(): AuthUser? {
        val token = secure.get(SecureStore.Keys.TOKEN)
        val userJson = secure.get(SecureStore.Keys.USER)
        if (token.isNullOrEmpty() || userJson == null) return null
        if (isJwtExpired(token)) return null
        return runCatching {
            json.decodeFromString(AuthUserDto.serializer(), userJson).toDomain()
        }.getOrNull()
    }

    fun logout() = secure.remove(SecureStore.Keys.TOKEN, SecureStore.Keys.USER)
}
