package uz.malika.erp.features.admin.data

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.core.SecureStore
import uz.malika.erp.data.remote.HttpClient
import java.util.concurrent.TimeUnit

/**
 * Builds the slice-local [AdminApi] from the foundation's configured pieces
 * (dev-config base URL, token, 401 channel) so it behaves exactly like the one
 * foundation client. It is memoized once per process.
 *
 * WORK-AROUND (noted in README): the foundation `ApiService` is off-limits and
 * does not declare the admin endpoints, so this re-applies the same two
 * interceptors rather than editing foundation code. The reused [HttpClient.json]
 * keeps request serialization identical (nulls omitted, defaults dropped).
 */
object AdminHttp {

    @Volatile
    private var cached: AdminApi? = null

    fun api(container: AppContainer): AdminApi =
        cached ?: synchronized(this) { cached ?: build(container).also { cached = it } }

    private fun build(container: AppContainer): AdminApi {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(baseUrlInterceptor(container))
            .addInterceptor(authInterceptor(container))
            .build()

        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl("http://localhost/") // placeholder; rewritten per request
            .client(client)
            .addConverterFactory(HttpClient.json.asConverterFactory(contentType))
            .build()
            .create(AdminApi::class.java)
    }

    private fun baseUrlInterceptor(container: AppContainer) = Interceptor { chain ->
        val original = chain.request()
        val configured = container.devConfig.currentBaseUrl.toHttpUrlOrNull()
            ?: return@Interceptor chain.proceed(original)
        val url = original.url.newBuilder()
            .scheme(configured.scheme)
            .host(configured.host)
            .port(configured.port)
            .build()
        chain.proceed(original.newBuilder().url(url).build())
    }

    private fun authInterceptor(container: AppContainer) = Interceptor { chain ->
        val token = container.secure.get(SecureStore.Keys.TOKEN)
        val request = if (!token.isNullOrEmpty()) {
            chain.request().newBuilder().header("Authorization", "Bearer $token").build()
        } else {
            chain.request()
        }
        val response = chain.proceed(request)
        if (response.code == 401) {
            container.secure.remove(SecureStore.Keys.TOKEN, SecureStore.Keys.USER)
            container.authEvents.signalUnauthorized()
        }
        response
    }
}
