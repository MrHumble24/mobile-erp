package uz.malika.erp.features.purchases.data

import kotlinx.serialization.json.JsonObject
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.QueryMap

/**
 * The one Retrofit door for buying used phones (ADR 0039). All paths under
 * `/customer-purchases`. Online only — a buy is never queued (the server checks
 * the shift and posts the money live).
 */
interface PurchaseApi {

    @GET("customer-purchases")
    suspend fun list(@QueryMap query: Map<String, String>): CustomerPurchasePageDto

    @GET("customer-purchases/{id}")
    suspend fun get(@Path("id") id: String): CustomerPurchaseDto

    @POST("customer-purchases")
    suspend fun create(@Body body: JsonObject): CustomerPurchaseDto
}
