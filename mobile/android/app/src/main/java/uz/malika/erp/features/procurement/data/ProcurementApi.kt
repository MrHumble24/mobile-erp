package uz.malika.erp.features.procurement.data

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.DevConfigStore
import uz.malika.erp.core.SecureStore
import uz.malika.erp.data.remote.HttpClient

/**
 * The procurement group's REST surface (`/suppliers`, `/shipments`,
 * `/device-models`, `/devices`, `/qc`). These endpoints are not on the
 * wave-0 [uz.malika.erp.data.remote.ApiService], which this slice may not edit.
 *
 * ponytail: [createProcurementService] replays the foundation HttpClient's
 * base-URL + auth + 401 interceptors because the configured OkHttp/Retrofit is
 * not exposed. Integrator: promote these routes onto the shared ApiService and
 * delete this file + its client. Do not add a third client elsewhere.
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

    @POST("shipments")
    suspend fun createShipment(@Body body: CreateShipmentBody): ShipmentDto

    @PATCH("shipments/{id}")
    suspend fun updateShipment(@Path("id") id: String, @Body body: UpdateShipmentBody): ShipmentDto

    @POST("shipments/{id}/devices")
    suspend fun addDevices(@Path("id") id: String, @Body body: RegisterDevicesBody): List<RegisteredDeviceDto>

    @GET("device-models")
    suspend fun deviceModels(): List<DeviceModelDto>

    @GET("devices")
    suspend fun devices(
        @Query("shipmentId") shipmentId: String? = null,
        @Query("inspected") inspected: String? = null,
        @Query("pageSize") pageSize: Int = 50,
    ): PaginatedDevicesDto

    @GET("devices/by-imei/{imei}")
    suspend fun deviceByImei(@Path("imei") imei: String): QcDeviceDto

    @POST("qc/inspections")
    suspend fun createInspection(@Body body: CreateInspectionBody)

    @GET("qc/inspections")
    suspend fun inspections(
        @Query("passed") passed: String? = null,
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

/** Builds the procurement service on its own client (see the class note). */
fun createProcurementService(container: AppContainer): ProcurementService {
    val client = OkHttpClient.Builder()
        .addInterceptor(baseUrlInterceptor(container.devConfig))
        .addInterceptor(authInterceptor(container.secure, container.authEvents))
        .build()
    val contentType = "application/json".toMediaType()
    return Retrofit.Builder()
        .baseUrl("http://localhost/")
        .client(client)
        .addConverterFactory(HttpClient.json.asConverterFactory(contentType))
        .build()
        .create(ProcurementService::class.java)
}

private fun baseUrlInterceptor(devConfig: DevConfigStore) = Interceptor { chain ->
    val original = chain.request()
    val configured = devConfig.currentBaseUrl.toHttpUrlOrNull()
        ?: return@Interceptor chain.proceed(original)
    val url = original.url.newBuilder()
        .scheme(configured.scheme).host(configured.host).port(configured.port).build()
    chain.proceed(original.newBuilder().url(url).build())
}

private fun authInterceptor(secure: SecureStore, authEvents: AuthEvents) = Interceptor { chain ->
    val token = secure.get(SecureStore.Keys.TOKEN)
    val request = if (!token.isNullOrEmpty()) {
        chain.request().newBuilder().header("Authorization", "Bearer $token").build()
    } else {
        chain.request()
    }
    val response = chain.proceed(request)
    if (response.code == 401) {
        secure.remove(SecureStore.Keys.TOKEN, SecureStore.Keys.USER)
        authEvents.signalUnauthorized()
    }
    response
}
