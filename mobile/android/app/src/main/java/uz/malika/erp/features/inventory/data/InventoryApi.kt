package uz.malika.erp.features.inventory.data

import kotlinx.serialization.Serializable
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
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.DevConfigStore
import uz.malika.erp.core.SecureStore
import uz.malika.erp.data.remote.HttpClient
import java.util.concurrent.TimeUnit

/**
 * The inventory slice's online endpoints: device detail/history/writes, device
 * models, and stock-alert rules. None of these live on the foundation
 * `ApiService` (devices + partners are the only synced reads), so this slice
 * owns a tiny Retrofit over a second OkHttp client that reuses the foundation's
 * base-URL switch + bearer-auth behaviour. See [InventoryApi.create] and the
 * slice README — the integrator may promote these onto the shared ApiService.
 */
interface InventoryApi {

    @GET("devices/by-imei/{imei}")
    suspend fun deviceByImei(@Path("imei") imei: String): DeviceDetailDto

    @GET("devices/{id}/history")
    suspend fun deviceHistory(@Path("id") id: String): List<DeviceHistoryDto>

    @PATCH("devices/{id}")
    suspend fun updateDevice(@Path("id") id: String, @Body body: JsonElement)

    @POST("devices/{id}/status")
    suspend fun changeStatus(@Path("id") id: String, @Body body: ChangeStatusBody)

    @GET("device-models")
    suspend fun deviceModels(): List<DeviceModelDto>

    @POST("device-models")
    suspend fun createModel(@Body body: ModelWriteBody)

    @PATCH("device-models/{id}")
    suspend fun updateModel(@Path("id") id: String, @Body body: ModelWriteBody)

    @GET("stock-alert-rules")
    suspend fun rules(): List<StockAlertRuleDto>

    @GET("stock-alert-rules/low-stock")
    suspend fun lowStock(): List<LowStockDto>

    @POST("stock-alert-rules")
    suspend fun createRule(@Body body: CreateRuleBody)

    @PATCH("stock-alert-rules/{id}")
    suspend fun updateRule(@Path("id") id: String, @Body body: UpdateRuleBody)

    companion object {
        /**
         * Builds the slice client from the foundation container's pieces. The
         * two interceptors mirror `data.remote.HttpClient` (which keeps them
         * private); kept here so the slice needs no foundation edit.
         */
        fun create(container: AppContainer): InventoryApi {
            val client = OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(baseUrlInterceptor(container.devConfig))
                .addInterceptor(authInterceptor(container.secure, container.authEvents))
                .build()
            val contentType = "application/json".toMediaType()
            return Retrofit.Builder()
                .baseUrl("http://localhost/") // placeholder; rewritten per request
                .client(client)
                .addConverterFactory(HttpClient.json.asConverterFactory(contentType))
                .build()
                .create(InventoryApi::class.java)
        }

        private fun baseUrlInterceptor(devConfig: DevConfigStore) = Interceptor { chain ->
            val original = chain.request()
            val configured = devConfig.currentBaseUrl.toHttpUrlOrNull()
                ?: return@Interceptor chain.proceed(original)
            val url = original.url.newBuilder()
                .scheme(configured.scheme)
                .host(configured.host)
                .port(configured.port)
                .build()
            chain.proceed(original.newBuilder().url(url).build())
        }

        private fun authInterceptor(secure: SecureStore, authEvents: AuthEvents) =
            Interceptor { chain ->
                val token = secure.get(SecureStore.Keys.TOKEN)
                val request = if (!token.isNullOrEmpty()) {
                    chain.request().newBuilder()
                        .header("Authorization", "Bearer $token").build()
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
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

@Serializable
data class DeviceDetailDto(
    val id: String,
    val imei: String,
    val modelId: String,
    val statusCode: String,
    val version: Int,
    val targetPrice: JsonElement? = null,
    val landedCost: JsonElement? = null, // redacted → absent for under-privileged users
    val intakeDate: String? = null,
    val model: ModelRefDto? = null,
    val specs: JsonElement? = null,
    val latestInspection: QcDto? = null,
)

@Serializable
data class ModelRefDto(val brand: String = "", val name: String = "")

@Serializable
data class QcDto(
    val passed: Boolean = false,
    val gradeCode: String? = null,
    val batteryHealth: Int? = null,
)

@Serializable
data class DeviceHistoryDto(
    val id: String,
    val fromStatusCode: String? = null,
    val toStatusCode: String,
    val reason: String? = null,
    val changedAt: String? = null,
)

@Serializable
data class DeviceModelDto(
    val id: String,
    val brand: String,
    val name: String,
    val isActive: Boolean = true,
    val attributes: List<AttributeDefDto> = emptyList(),
)

@Serializable
data class AttributeDefDto(
    val key: String,
    val label: String,
    val type: String = "text",
    val options: List<String> = emptyList(),
    val required: Boolean = false,
    val sortOrder: Int = 0,
)

@Serializable
data class StockAlertRuleDto(
    val id: String,
    val modelId: String,
    val storage: String,
    val threshold: Int,
)

@Serializable
data class LowStockDto(
    val id: String,
    val modelId: String,
    val storage: String,
    val threshold: Int,
    val currentCount: Int = 0,
)

// ── Request DTOs ──────────────────────────────────────────────────────────────

@Serializable
data class ChangeStatusBody(
    val toStatusCode: String,
    val expectedVersion: Int,
    val reason: String? = null, // omitted when null (explicitNulls=false)
)

@Serializable
data class ModelWriteBody(
    val brand: String,
    val name: String,
    val attributes: List<AttributeDefDto>,
    val isActive: Boolean? = null, // sent on edit only
)

@Serializable
data class CreateRuleBody(val modelId: String, val storage: String, val threshold: Int)

@Serializable
data class UpdateRuleBody(val storage: String, val threshold: Int)
