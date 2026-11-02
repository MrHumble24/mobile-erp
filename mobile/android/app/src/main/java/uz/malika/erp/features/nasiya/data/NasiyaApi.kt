package uz.malika.erp.features.nasiya.data

import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.QueryMap

/**
 * Retrofit surface for `/partners/…` and `/consignments/…`, not carried by the
 * foundation `ApiService` (wave-0 minimal: auth + sync only). Retrofit
 * interface only — built via `container.retrofit.create(NasiyaApi::class.java)`,
 * the one shared OkHttp/base-URL/bearer/401 pipeline.
 */
interface NasiyaApi {

    // ── partners (online) ─────────────────────────────────────────────────
    @GET("partners")
    suspend fun listPartners(@QueryMap params: Map<String, String>): List<PartnerListDto>

    @GET("partners/{id}")
    suspend fun partner(@Path("id") id: String): PartnerDetailDto

    @GET("partners/{id}/ledger")
    suspend fun ledger(@Path("id") id: String): List<LedgerEntryDto>

    @GET("partners/{id}/aging")
    suspend fun aging(@Path("id") id: String): List<AgingBucketDto>

    @POST("partners")
    suspend fun createPartner(@Body body: CreatePartnerBody): JsonElement

    @PATCH("partners/{id}")
    suspend fun updatePartner(@Path("id") id: String, @Body body: UpdatePartnerBody): JsonElement

    @POST("partners/{id}/payments")
    suspend fun recordPayment(@Path("id") id: String, @Body body: RecordPaymentBody): JsonElement

    // ── consignments (reads online; writes go through ConsignmentWriter) ───
    @GET("consignments")
    suspend fun listConsignments(@QueryMap params: Map<String, String>): ConsignmentPageDto

    @GET("consignments/{id}")
    suspend fun consignment(@Path("id") id: String): ConsignmentViewDto

    @GET("consignments/stats")
    suspend fun stats(@QueryMap params: Map<String, String>): ConsignmentStatsDto

    @POST("consignments")
    suspend fun createConsignment(@Body body: CreateConsignmentBody): JsonElement

    @POST("consignments/{id}/settle")
    suspend fun settle(@Path("id") id: String, @Body body: SettleBody): JsonElement

    @POST("consignments/{id}/return")
    suspend fun returnToStock(@Path("id") id: String, @Body body: ReturnBody): JsonElement
}
