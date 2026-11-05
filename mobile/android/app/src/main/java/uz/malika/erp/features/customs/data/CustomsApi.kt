package uz.malika.erp.features.customs.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * The customs price-list REST surface (`/customs/price-lists`, ADR 0027).
 * Retrofit interface only — built via `container.retrofit.create(...)`, the one
 * shared OkHttp/base-URL/bearer/401 pipeline. Reads need `customs.read`, the
 * POST needs `customs.manage` (enforced server-side).
 */
interface CustomsApi {

    /** The newest list, or JSON `null` when no list exists yet. */
    @GET("customs/price-lists/current")
    suspend fun current(): CurrentListDto?

    @GET("customs/price-lists")
    suspend fun versions(): List<PriceListVersionDto>

    @GET("customs/price-lists/unmatched-models")
    suspend fun unmatchedModels(): List<UnmatchedModelDto>

    @GET("customs/price-lists/fees/{customsCode}/history")
    suspend fun feeHistory(@Path("customsCode") customsCode: String): List<FeeHistoryPointDto>

    @POST("customs/price-lists")
    suspend fun createPriceList(@Body body: CreatePriceListBody): PriceListVersionDto
}
