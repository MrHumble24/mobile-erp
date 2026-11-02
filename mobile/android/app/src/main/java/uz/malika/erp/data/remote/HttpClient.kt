package uz.malika.erp.data.remote

import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.DevConfigStore
import uz.malika.erp.core.SecureStore
import java.util.concurrent.TimeUnit

/**
 * Builds the single [ApiService]. Mirrors the web `shared/api/http.ts`:
 *  - rewrites each request to the currently-configured base URL (runtime switch),
 *  - attaches `Authorization: Bearer <token>` from secure storage,
 *  - on a 401 that is NOT the login call: wipes the token + user and signals
 *    [AuthEvents] (→ the app returns to login).
 * The error envelope is normalized at the repository layer by `runApi`.
 */
object HttpClient {

    val json: Json = Json {
        ignoreUnknownKeys = true // responses carry fields we don't model
        explicitNulls = false // omit nulls so request DTOs stay clean (forbidNonWhitelisted)
        encodeDefaults = false // never send default-valued fields the server rejects
        isLenient = true
    }

    fun build(
        devConfig: DevConfigStore,
        secure: SecureStore,
        authEvents: AuthEvents,
    ): ApiService {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(baseUrlInterceptor(devConfig))
            .addInterceptor(authInterceptor(secure, authEvents))
            .build()

        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl("http://localhost/") // placeholder; rewritten per request
            .client(client)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
            .create(ApiService::class.java)
    }

    /** Swap scheme/host/port of every request to the live dev-config base URL. */
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
        val isLogin = request.url.encodedPath.endsWith("/auth/login")
        if (response.code == 401 && !isLogin) {
            secure.remove(SecureStore.Keys.TOKEN, SecureStore.Keys.USER)
            authEvents.signalUnauthorized()
        }
        response
    }
}
