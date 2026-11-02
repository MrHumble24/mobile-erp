package uz.malika.erp.data.remote

import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * The one Retrofit interface. Paths are relative (no leading slash) and the
 * server has no global prefix. The base URL is rewritten per-request by the
 * HTTP client's base-URL interceptor, so switching environment needs no rebuild.
 */
interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("auth/me")
    suspend fun me(): AuthUserDto

    @GET("sync/changes")
    suspend fun changes(@Query("since") since: String?): ChangesResponse

    @POST("sync/push")
    suspend fun push(@Body body: PushRequest): PushResponse

    /** Raw conflict rows (shape owned by the server); wave 7 parses them. */
    @GET("sync/conflicts")
    suspend fun conflicts(): JsonElement

    @POST("sync/conflicts/{id}/resolve")
    suspend fun resolveConflict(@Path("id") id: String, @Body body: ResolveConflictRequest)
}
