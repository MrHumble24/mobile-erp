package uz.malika.erp.features.procurement.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * The procurement group's REST surface (`/suppliers`, `/shipments`,
 * `/device-models`, `/devices`, `/qc`). Retrofit interface only — built via
 * `container.retrofit.create(ProcurementService::class.java)`, the one shared
 * OkHttp/base-URL/bearer/401 pipeline.
 */
interface ProcurementService {

    @GET("suppliers")
    suspend fun suppliers(): List<SupplierDto>

    @POST("suppliers")
    suspend fun createSupplier(@Body body: SupplierBody): SupplierDto

    @PATCH("suppliers/{id}")
    suspend fun updateSupplier(@Path("id") id: String, @Body body: SupplierBody): SupplierDto

    @GET("shipments")
    suspend fun shipments(): List<ShipmentDto>

    /** `GET /shipments/:id` — a shipment plus its quantity purchase lines (ADR 0034). */
    @GET("shipments/{id}")
    suspend fun shipment(@Path("id") id: String): ShipmentDto

    @POST("shipments")
    suspend fun createShipment(@Body body: CreateShipmentBody): ShipmentDto

    @PATCH("shipments/{id}")
    suspend fun updateShipment(@Path("id") id: String, @Body body: UpdateShipmentBody): ShipmentDto

    @POST("shipments/{id}/devices")
    suspend fun addDevices(@Path("id") id: String, @Body body: RegisterDevicesBody): List<RegisteredDeviceDto>

    /** Buy quantity products into a shipment (ADR 0030); needs `device.create`. */
    @POST("shipments/{id}/items")
    suspend fun addItems(@Path("id") id: String, @Body body: RegisterItemsBody): List<PurchasedLineDto>

    @GET("device-models")
    suspend fun deviceModels(): List<DeviceModelDto>

    /** Device-code lookup for intake autofill (ADR 0031); 404 when unknown. */
    @GET("lookup")
    suspend fun codeLookup(@Query("code") code: String): CodeLookupResultDto

    /** Remember which of our products a reference model is (needs `device.update`). */
    @POST("lookup/links")
    suspend fun learnLink(@Body body: LearnLinkBody)

    @GET("devices")
    suspend fun devices(
        @Query("shipmentId") shipmentId: String? = null,
        @Query("inspected") inspected: String? = null,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 50,
    ): PaginatedDevicesDto

    @GET("devices/by-imei/{imei}")
    suspend fun deviceByImei(@Path("imei") imei: String): QcDeviceDto

    @POST("qc/inspections")
    suspend fun createInspection(@Body body: CreateInspectionBody)

    @GET("qc/inspections")
    suspend fun inspections(
        @Query("passed") passed: String? = null,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 50,
    ): PaginatedInspectionsDto

    @GET("qc/stats")
    suspend fun stats(@Query("from") from: String? = null, @Query("to") to: String? = null): QcStatsDto

    @GET("qc/{kind}")
    suspend fun lookups(
        @Path("kind") kind: String,
        @Query("includeInactive") includeInactive: String? = null,
    ): List<LookupDto>

    @POST("qc/{kind}")
    suspend fun createLookup(@Path("kind") kind: String, @Body body: LookupBody)

    @PATCH("qc/{kind}/{code}")
    suspend fun updateLookup(@Path("kind") kind: String, @Path("code") code: String, @Body body: LookupBody)
}
