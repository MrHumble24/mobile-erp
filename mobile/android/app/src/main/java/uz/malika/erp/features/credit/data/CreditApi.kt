package uz.malika.erp.features.credit.data

import kotlinx.serialization.json.JsonObject
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * The one Retrofit door for customer credit (ADR 0035). Credit is ONLINE only —
 * there is no outbox handler; a create/payment that fails offline is simply not
 * queued (the server must check the limit live).
 */
interface CreditApi {

    @GET("credits")
    suspend fun list(
        @Query("customerId") customerId: String?,
        @Query("status") status: String?,
    ): List<CreditListItem>

    @GET("credits/{id}")
    suspend fun get(@Path("id") id: String): CreditView

    @GET("credits/{id}/contract")
    suspend fun contract(@Path("id") id: String): CreditContract

    @GET("credits/report")
    suspend fun report(): CreditReport

    @POST("credits")
    suspend fun create(@Body body: JsonObject): CreditView

    @POST("credits/{id}/payments")
    suspend fun addPayment(@Path("id") id: String, @Body body: CreditPaymentBody): CreditView

    @POST("credits/{id}/refund")
    suspend fun refund(@Path("id") id: String, @Body body: CreditPaymentBody): CreditView
}
