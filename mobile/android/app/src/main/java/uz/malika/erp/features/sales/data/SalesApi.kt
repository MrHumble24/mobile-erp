package uz.malika.erp.features.sales.data

import kotlinx.serialization.json.JsonObject
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.QueryMap

/**
 * The POS/sales/customers endpoints not carried by the foundation `ApiService`.
 * Retrofit interface only — no logic. Built via `container.retrofit.create(...)`
 * (the one shared OkHttp/base-URL/bearer/401 pipeline).
 */
interface SalesApi {
    @GET("devices/by-imei/{imei}")
    suspend fun deviceByImei(@Path("imei") imei: String): DeviceByImeiDto

    /** Resolve any scanned/typed code to a unit or a quantity product (ADR 0030). */
    @GET("scan/{code}")
    suspend fun scan(@Path("code") code: String): ScanResultDto

    /** Find quantity products by name/barcode/model code for the till (ADR 0030). */
    @GET("stock")
    suspend fun stockSearch(@QueryMap query: Map<String, String>): List<QuantityProductDto>

    /** Direct online sale (ADR 0039 trade-in path): posts one sale now, never queued. */
    @POST("sales")
    suspend fun createSale(@Body body: JsonObject): SaleDto

    @GET("sales")
    suspend fun sales(@QueryMap query: Map<String, String>): SalesPageDto

    @GET("sales/stats")
    suspend fun salesStats(@QueryMap query: Map<String, String>): SaleStatsDto

    /** Cashier options for the sales filter; gated by `user.read` (admins only). */
    @GET("users")
    suspend fun users(@QueryMap query: Map<String, String>): UsersPageDto

    @GET("sales/{id}")
    suspend fun sale(@Path("id") id: String): SaleDto

    @GET("sales/warranty/{imei}")
    suspend fun warranty(@Path("imei") imei: String): WarrantyDto

    @GET("sales/{id}/receipt")
    suspend fun receipt(@Path("id") id: String): ReceiptDto

    @POST("sales/{id}/return")
    suspend fun returnSale(@Path("id") id: String, @Body body: ReturnBody): SaleDto

    @GET("settings")
    suspend fun settings(): SettingsDto

    @GET("customers")
    suspend fun customers(@QueryMap query: Map<String, String>): CustomerPageDto

    @GET("customers/stats")
    suspend fun customerStats(): CustomerStatsDto

    @GET("customers/lookup")
    suspend fun customerLookup(@Query("q") q: String?): List<CustomerDto>

    /** One customer with purchase + credit aggregates (ADR 0035). */
    @GET("customers/{id}")
    suspend fun customer(@Path("id") id: String): CustomerListItemDto

    @GET("customers/{id}/sales")
    suspend fun customerSales(@Path("id") id: String): List<SaleDto>

    /** The customer's bonus balance + history + the store's live config echo. */
    @GET("customers/{id}/bonus")
    suspend fun customerBonus(@Path("id") id: String): CustomerBonusDto

    /** Owner manual bonus-point correction (permission `bonus.adjust`). */
    @POST("customers/{id}/bonus/adjustments")
    suspend fun adjustCustomerBonus(@Path("id") id: String, @Body body: AdjustBonusBody): CustomerBonusDto

    @POST("customers")
    suspend fun createCustomer(@Body body: CreateCustomerBody): CustomerDto

    @PATCH("customers/{id}")
    suspend fun updateCustomer(@Path("id") id: String, @Body body: UpdateCustomerBody): CustomerDto
}
