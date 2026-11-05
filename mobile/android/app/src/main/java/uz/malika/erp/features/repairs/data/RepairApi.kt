package uz.malika.erp.features.repairs.data

import kotlinx.serialization.json.JsonObject
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.QueryMap

/**
 * The one Retrofit door for repairs (ADR 0040). All paths under `/repairs`; every
 * route refuses 403 `REPAIRS_DISABLED` when the setting is off. Online only.
 */
interface RepairApi {

    @GET("repairs")
    suspend fun list(@QueryMap query: Map<String, String>): RepairPage

    @GET("repairs/{id}")
    suspend fun get(@Path("id") id: String): RepairView

    @GET("repairs/report")
    suspend fun report(@QueryMap query: Map<String, String>): RepairReport

    @POST("repairs")
    suspend fun create(@Body body: JsonObject): RepairView

    @PATCH("repairs/{id}")
    suspend fun update(@Path("id") id: String, @Body body: JsonObject): RepairView

    @POST("repairs/{id}/status")
    suspend fun changeStatus(@Path("id") id: String, @Body body: ChangeStatusBody): RepairView

    @POST("repairs/{id}/parts")
    suspend fun addPart(@Path("id") id: String, @Body body: AddPartBody): RepairView

    @DELETE("repairs/{id}/parts/{partId}")
    suspend fun removePart(@Path("id") id: String, @Path("partId") partId: String): RepairView

    @POST("repairs/{id}/payments")
    suspend fun addPayment(@Path("id") id: String, @Body body: RepairMoneyBody): RepairView

    @POST("repairs/{id}/refund")
    suspend fun refund(@Path("id") id: String, @Body body: RepairMoneyBody): RepairView

    @POST("repairs/{id}/outside-payment")
    suspend fun outsidePayment(@Path("id") id: String, @Body body: RepairMoneyBody): RepairView
}
