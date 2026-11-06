package uz.malika.erp.data.remote

import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import org.json.JSONObject
import uz.malika.erp.core.AuthEvents
import uz.malika.erp.core.DevConfigStore
import uz.malika.erp.core.SecureStore
import uz.malika.erp.core.StoreEvents
import uz.malika.erp.core.logging.AppLog
import java.util.concurrent.TimeUnit

/**
 * Builds the single configured [Retrofit]. Mirrors the web `shared/api/http.ts`:
 *  - rewrites each request to the currently-configured base URL (runtime switch),
 *  - attaches `Authorization: Bearer <token>` from secure storage,
 *  - attaches `X-Store-Id: <storeId>` on all non-login calls when an active store exists,
 *  - on a 401 that is NOT the login call: wipes the token + user and signals
 *    [AuthEvents] (→ the app returns to login),
 *  - on a 400 STORE_REQUIRED or 403 STORE_FORBIDDEN: signals [StoreEvents].
 * The error envelope is normalized at the repository layer by `runApi`.
 *
 * It returns the shared [Retrofit] (not a single interface): every slice calls
 * `container.retrofit.create(FeatureApi::class.java)` so there is one OkHttp
 * client, one base-URL/bearer/store/401 pipeline, for the whole app.
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
        activeStoreId: () -> String? = { secure.get(SecureStore.Keys.ACTIVE_STORE_ID) },
        storeEvents: StoreEvents? = null,
    ): Retrofit {
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(baseUrlInterceptor(devConfig))
            .addInterceptor(authInterceptor(secure, authEvents, activeStoreId, storeEvents))
            .addInterceptor(networkLogInterceptor()) // last: logs the final request
            .build()

        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl("http://localhost/") // placeholder; rewritten per request
            .client(client)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
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

    private fun authInterceptor(
        secure: SecureStore,
        authEvents: AuthEvents,
        activeStoreId: () -> String?,
        storeEvents: StoreEvents?,
    ) = Interceptor { chain ->
        val original = chain.request()
        val isLogin = original.url.encodedPath.endsWith("/auth/login")
        val token = secure.get(SecureStore.Keys.TOKEN)
        val storeId = if (!isLogin) activeStoreId() else null

        val reqBuilder = original.newBuilder()
        if (!token.isNullOrEmpty()) {
            reqBuilder.header("Authorization", "Bearer $token")
        }
        if (!storeId.isNullOrEmpty()) {
            reqBuilder.header("X-Store-Id", storeId)
        }
        val request = reqBuilder.build()
        val response = chain.proceed(request)

        if (response.code == 401 && !isLogin) {
            AppLog.w("auth", "401 on ${request.url.encodedPath} → clearing session")
            secure.remove(SecureStore.Keys.TOKEN, SecureStore.Keys.USER)
            authEvents.signalUnauthorized()
        }

        if ((response.code == 400 || response.code == 403) && !isLogin) {
            val peek = runCatching { response.peekBody(4096).string() }.getOrNull()
            if (!peek.isNullOrBlank()) {
                val code = runCatching { JSONObject(peek).optString("code") }.getOrNull()
                if (code == "STORE_REQUIRED") {
                    AppLog.w("store", "STORE_REQUIRED on ${request.url.encodedPath}")
                    storeEvents?.signalStoreRequired()
                } else if (code == "STORE_FORBIDDEN") {
                    AppLog.w("store", "STORE_FORBIDDEN on ${request.url.encodedPath}")
                    storeEvents?.signalStoreForbidden()
                }
            }
        }

        response
    }
}
