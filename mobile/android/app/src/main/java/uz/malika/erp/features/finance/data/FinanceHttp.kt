package uz.malika.erp.features.finance.data

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.DevConfigStore
import uz.malika.erp.core.SecureStore
import uz.malika.erp.data.remote.HttpClient
import java.util.concurrent.TimeUnit

/**
 * Builds the slice's [FinanceApi] once per process. It reuses the foundation's
 * base-url switch, bearer auth and 401→session-clear behaviour (same
 * interceptors as `data/remote/HttpClient`).
 *
 * WORKAROUND (see slice README / task notes): the foundation `ApiService` is a
 * fixed interface with only auth+sync routes and exposes no shared Retrofit/
 * OkHttp instance, so a feature cannot add typed endpoints without a second
 * client. This mirrors the one client exactly; the real fix is foundation-side
 * (expose the configured `Retrofit` so features call `.create(FeatureApi)`).
 */
object FinanceHttp {

    @Volatile private var cached: FinanceApi? = null

    fun api(container: AppContainer): FinanceApi =
        cached ?: synchronized(this) { cached ?: build(container).also { cached = it } }

    private fun build(container: AppContainer): FinanceApi {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(baseUrlInterceptor(container.devConfig))
            .addInterceptor(authInterceptor(container.secure, container.authEvents))
            .build()
        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl("http://localhost/")
            .client(client)
            .addConverterFactory(HttpClient.json.asConverterFactory(contentType))
            .build()
            .create(FinanceApi::class.java)
    }

    private fun baseUrlInterceptor(devConfig: DevConfigStore) = Interceptor { chain ->
        val original = chain.request()
        val configured = devConfig.currentBaseUrl.toHttpUrlOrNull()
            ?: return@Interceptor chain.proceed(original)
        val url = original.url.newBuilder()
            .scheme(configured.scheme)
            .host(configured.host)
            .port(configured.port)
            .build()
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
}
