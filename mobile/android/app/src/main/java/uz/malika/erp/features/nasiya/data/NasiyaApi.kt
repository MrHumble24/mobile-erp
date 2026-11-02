package uz.malika.erp.features.nasiya.data

import kotlinx.serialization.json.JsonElement
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.QueryMap
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.DevConfigStore
import uz.malika.erp.core.SecureStore
import uz.malika.erp.data.remote.HttpClient
import java.util.concurrent.TimeUnit

/**
 * Retrofit surface for `/partners/…` and `/consignments/…`. The foundation
 * [uz.malika.erp.data.remote.ApiService] is wave-0 minimal (auth + sync only)
 * and is integrator-owned, so this slice declares its own interface.
 *
 * It is NOT a second HTTP client in the config-drift sense: [NasiyaApiFactory]
 * reads the SAME [DevConfigStore]/[SecureStore]/[AuthEvents] the foundation
 * client reads, so base-URL switching and the 401→logout contract still hold.
 * The integrator can delete this file once these routes move onto ApiService.
 */
interface NasiyaApi {

    // ── partners (online) ─────────────────────────────────────────────────
    @GET("partners/{id}")
    suspend fun partner(@Path("id") id: String): PartnerDetailDto

    @GET("partners/{id}/ledger")
    suspend fun ledger(@Path("id") id: String): List<LedgerEntryDto>

    @GET("partners/{id}/aging")
    suspend fun aging(@Path("id") id: String): List<AgingBucketDto>

    @POST("partners")
    suspend fun createPartner(@Body body: CreatePartnerBody): JsonElement

    @PATCH("partners/{id}")
    suspend fun updatePartner(@Path("id") id: String, @Body body: UpdatePartnerBody): JsonElement

    @POST("partners/{id}/payments")
    suspend fun recordPayment(@Path("id") id: String, @Body body: RecordPaymentBody): JsonElement

    // ── consignments (reads online; writes go through ConsignmentWriter) ───
    @GET("consignments")
    suspend fun listConsignments(@QueryMap params: Map<String, String>): ConsignmentPageDto

    @GET("consignments/overdue")
    suspend fun overdue(): List<ConsignmentViewDto>

    @GET("consignments/stats")
    suspend fun stats(@QueryMap params: Map<String, String>): ConsignmentStatsDto

    @POST("consignments")
    suspend fun createConsignment(@Body body: CreateConsignmentBody): JsonElement

    @POST("consignments/{id}/settle")
    suspend fun settle(@Path("id") id: String, @Body body: SettleBody): JsonElement

    @POST("consignments/{id}/return")
    suspend fun returnToStock(@Path("id") id: String, @Body body: ReturnBody): JsonElement
}

/** Builds [NasiyaApi] on the same runtime config as the foundation client. */
object NasiyaApiFactory {
    fun build(
        devConfig: DevConfigStore,
        secure: SecureStore,
        authEvents: AuthEvents,
    ): NasiyaApi {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(baseUrl(devConfig))
            .addInterceptor(auth(secure, authEvents))
            .build()
        return Retrofit.Builder()
            .baseUrl("http://localhost/") // rewritten per request
            .client(client)
            .addConverterFactory(HttpClient.json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(NasiyaApi::class.java)
    }

    private fun baseUrl(devConfig: DevConfigStore) = Interceptor { chain ->
        val original = chain.request()
        val configured = devConfig.currentBaseUrl.toHttpUrlOrNull()
            ?: return@Interceptor chain.proceed(original)
        val url = original.url.newBuilder()
            .scheme(configured.scheme).host(configured.host).port(configured.port).build()
        chain.proceed(original.newBuilder().url(url).build())
    }

    private fun auth(secure: SecureStore, authEvents: AuthEvents) = Interceptor { chain ->
        val token = secure.get(SecureStore.Keys.TOKEN)
        val request = if (!token.isNullOrEmpty()) {
            chain.request().newBuilder().header("Authorization", "Bearer $token").build()
        } else {
            chain.request()
        }
        val response = chain.proceed(request)
        if (response.code == 401) {
            secure.remove(SecureStore.Keys.TOKEN, SecureStore.Keys.USER)
            authEvents.signalUnauthorized()
        }
        response
    }
}
