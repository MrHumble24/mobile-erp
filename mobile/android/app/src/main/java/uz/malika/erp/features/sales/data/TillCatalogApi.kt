package uz.malika.erp.features.sales.data

import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.QueryMap

/**
 * The till catalog read endpoints (ADR 0031): the product grid and, after a card
 * is tapped, its in-stock units. Plus the product categories for the filter
 * chips. Retrofit interface only — built via `container.retrofit.create(...)`,
 * the one shared OkHttp/base-URL/bearer/401 pipeline.
 */
interface TillCatalogApi {
    /** `GET /catalog?categoryId&search` — one card per sellable product. */
    @GET("catalog")
    suspend fun catalog(@QueryMap query: Map<String, String>): List<CatalogEntryDto>

    /** `GET /catalog/:modelId/units` — the in-stock units to pick from. */
    @GET("catalog/{modelId}/units")
    suspend fun units(@Path("modelId") modelId: String): List<CatalogUnitDto>

    @GET("product-categories")
    suspend fun categories(): List<CatalogCategoryDto>
}
