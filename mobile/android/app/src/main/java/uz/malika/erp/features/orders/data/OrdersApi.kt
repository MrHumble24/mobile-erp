package uz.malika.erp.features.orders.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.QueryMap

/**
 * Staff-facing endpoints for storefront orders (ADR 0049, 0050).
 * Scoped to the active branch via X-Store-Id. Online only.
 */
interface OrdersApi {

    @GET("storefront-orders")
    suspend fun list(@QueryMap query: Map<String, String>): OrderListResponse

    @GET("storefront-orders/stats")
    suspend fun stats(): StorefrontOrderStats

    @GET("storefront-orders/{id}")
    suspend fun get(@Path("id") id: String): StorefrontOrderDetail

    @PATCH("storefront-orders/{id}/status")
    suspend fun updateStatus(
        @Path("id") id: String,
        @Body body: UpdateOrderStatusDto,
    ): StorefrontOrderDetail
}
