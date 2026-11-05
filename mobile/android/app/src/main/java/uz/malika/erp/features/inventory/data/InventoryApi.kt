package uz.malika.erp.features.inventory.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * The inventory slice's online endpoints: device detail/history/writes, device
 * models, and stock-alert rules. None of these live on the foundation
 * `ApiService` (devices + partners are the only synced reads). Retrofit
 * interface only — built via `container.retrofit.create(InventoryApi::class.java)`,
 * the one shared OkHttp/base-URL/bearer/401 pipeline.
 */
interface InventoryApi {

    @GET("devices/by-imei/{imei}")
    suspend fun deviceByImei(@Path("imei") imei: String): DeviceDetailDto

    @GET("devices/{id}/history")
    suspend fun deviceHistory(@Path("id") id: String): List<DeviceHistoryDto>

    @PATCH("devices/{id}")
    suspend fun updateDevice(@Path("id") id: String, @Body body: JsonElement)

    @PATCH("devices/{id}/expense")
    suspend fun setExpense(@Path("id") id: String, @Body body: JsonElement)

    @PATCH("devices/{id}/customs-fee")
    suspend fun setCustomsFee(@Path("id") id: String, @Body body: JsonElement)

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
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

@Serializable
data class DeviceDetailDto(
    val id: String,
    val imei: String,
    val imei2: String? = null,
    val modelId: String,
    val statusCode: String,
    val version: Int,
    val targetPrice: JsonElement? = null,
    val landedCost: JsonElement? = null, // redacted → absent for under-privileged users
    val acquisitionCost: JsonElement? = null, // redacted with the other cost fields
    val customsFee: JsonElement? = null,
    val unitExpense: JsonElement? = null,
    val unitExpenseNote: String? = null,
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
    val customsCode: String? = null,
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
    val customsCode: String? = null, // omitted when blank (explicitNulls=false)
)

@Serializable
data class CreateRuleBody(val modelId: String, val storage: String, val threshold: Int)

@Serializable
data class UpdateRuleBody(val storage: String, val threshold: Int)
