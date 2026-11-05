package uz.malika.erp.features.stock.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.QueryMap

/**
 * Quantity-product stock endpoints (ADR 0030). Retrofit interface only — built
 * via `container.retrofit.create(StockApi::class.java)`, the one shared
 * OkHttp/base-URL/bearer/401 pipeline. Reads need `device.read`; adjust needs
 * `stock.adjust` (server-enforced).
 */
interface StockApi {
    @GET("stock")
    suspend fun stock(@QueryMap query: Map<String, String>): List<StockLevelDto>

    @GET("stock/{modelId}/movements")
    suspend fun movements(
        @Path("modelId") modelId: String,
        @Query("page") page: Int,
        @Query("pageSize") pageSize: Int,
    ): StockMovementsPageDto

    @POST("stock/adjust")
    suspend fun adjust(@Body body: AdjustStockBody): StockLevelDto

    @GET("product-categories")
    suspend fun categories(): List<StockCategoryDto>
}
