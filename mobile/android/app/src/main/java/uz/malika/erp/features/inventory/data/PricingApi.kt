package uz.malika.erp.features.inventory.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PUT
import retrofit2.http.Path

/**
 * Price-manage endpoints (`/pricing`, permission `price.manage`, ADR 0034).
 * Its own Retrofit interface on the one shared OkHttp pipeline. PUT bodies are
 * hand-built JsonElements so a cleared cell goes up as an explicit `null`
 * (the shared Json omits typed nulls).
 */
interface PricingApi {
    @GET("pricing/products/{modelId}")
    suspend fun productPrices(@Path("modelId") modelId: String): ProductPricesDto

    @PUT("pricing/products/{modelId}")
    suspend fun setProductPrices(@Path("modelId") modelId: String, @Body body: JsonElement): ProductPricesDto

    @GET("pricing/units/{deviceId}")
    suspend fun unitPrices(@Path("deviceId") deviceId: String): UnitPricesDto

    @PUT("pricing/units/{deviceId}")
    suspend fun setUnitPrices(@Path("deviceId") deviceId: String, @Body body: JsonElement): UnitPricesDto
}

/** `GET /pricing/products/:modelId`. `storage == null` means "any storage"; `price` is a 2-dp string. */
@Serializable
data class ProductPricesDto(
    val modelId: String = "",
    val kindCode: String = "IMEI",
    val prices: List<ProductPriceEntryDto> = emptyList(),
)

@Serializable
data class ProductPriceEntryDto(
    val storage: String? = null,
    val levelCode: String = "",
    val price: String? = null,
)

/** `GET /pricing/units/:deviceId`. RETAIL is the unit's targetPrice. */
@Serializable
data class UnitPricesDto(
    val deviceId: String = "",
    val prices: List<UnitPriceEntryDto> = emptyList(),
)

@Serializable
data class UnitPriceEntryDto(val levelCode: String = "", val price: String? = null)
