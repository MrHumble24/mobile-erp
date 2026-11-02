package uz.malika.erp.features.sales.data

import kotlinx.serialization.json.Json
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
import retrofit2.http.QueryMap
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.DevConfigStore
import uz.malika.erp.core.SecureStore
import uz.malika.erp.data.remote.HttpClient
import java.util.concurrent.TimeUnit

/**
 * The POS/sales/customers endpoints the foundation `ApiService` does not carry.
 * Retrofit interface only — no logic. See [SalesApi.build] for the client note.
 */
interface SalesApi {
    @GET("devices/by-imei/{imei}")
    suspend fun deviceByImei(@Path("imei") imei: String): DeviceByImeiDto

    @GET("sales")
    suspend fun sales(@QueryMap query: Map<String, String>): SalesPageDto

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

    @GET("customers/lookup")
    suspend fun customerLookup(@Query("q") q: String?): List<CustomerDto>

    @GET("customers/{id}/sales")
    suspend fun customerSales(@Path("id") id: String): List<SaleDto>

    @POST("customers")
    suspend fun createCustomer(@Body body: CreateCustomerBody): CustomerDto

    @PATCH("customers/{id}")
    suspend fun updateCustomer(@Path("id") id: String, @Body body: UpdateCustomerBody): CustomerDto

    companion object {
        /**
         * ponytail / INTEGRATOR NOTE: the foundation exposes only `ApiService`
         * (auth + sync). This slice needs the `/sales`, `/customers` and
         * `/devices/by-imei` endpoints, which are not on it and must not be
         * hand-edited from a feature. So we build a second Retrofit over a
         * small OkHttp client that reuses the SAME token, base-URL and 401
         * semantics as `HttpClient` (via the public `SecureStore`,
         * `DevConfigStore`, `AuthEvents`). The right home is the foundation
         * `ApiService`; promote these endpoints there and delete this builder.
         */
        fun build(c: AppContainer): SalesApi =
            buildWith(c.devConfig, c.secure, c.authEvents, HttpClient.json)

        private fun buildWith(
            devConfig: DevConfigStore,
            secure: SecureStore,
            authEvents: AuthEvents,
            json: Json,
        ): SalesApi {
            val client = OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(baseUrl(devConfig))
                .addInterceptor(auth(secure, authEvents))
                .build()
            return Retrofit.Builder()
                .baseUrl("http://localhost/")
                .client(client)
                .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
                .build()
                .create(SalesApi::class.java)
        }

        private fun baseUrl(devConfig: DevConfigStore) = Interceptor { chain ->
            val original = chain.request()
            val configured = devConfig.currentBaseUrl.toHttpUrlOrNull()
                ?: return@Interceptor chain.proceed(original)
            val url = original.url.newBuilder()
                .scheme(configured.scheme).host(configured.host).port(configured.port).build()
            chain.proceed(original.newBuilder().url(url).build())
        }

        private fun auth(secure: SecureStore, authEvents: AuthEvents) = Interceptor { chain ->
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
    }
}
