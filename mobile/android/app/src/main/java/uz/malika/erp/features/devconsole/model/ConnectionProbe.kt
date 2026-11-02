package uz.malika.erp.features.devconsole.model

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/** Outcome of a "Test connection" probe. */
sealed interface ProbeResult {
    data class Reachable(val status: Int, val latencyMs: Long) : ProbeResult
    data class Unreachable(val error: String) : ProbeResult
}

/**
 * Pings a candidate base URL's public `/health` endpoint. Any HTTP response
 * (including 401) counts as reachable; only a transport failure is unreachable.
 *
 * ponytail: its own tiny OkHttpClient, not the shared one — the shared client's
 * base-URL interceptor rewrites the host to the active env, which would defeat
 * probing an arbitrary candidate URL. No bearer, short timeouts, dev-only.
 */
class ConnectionProbe(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .build(),
) {
    suspend fun probe(baseUrl: String): ProbeResult = withContext(Dispatchers.IO) {
        val url = baseUrl.trimEnd('/') + "/health"
        val start = System.currentTimeMillis()
        try {
            client.newCall(Request.Builder().url(url).get().build()).execute().use { res ->
                ProbeResult.Reachable(res.code, System.currentTimeMillis() - start)
            }
        } catch (e: Exception) {
            ProbeResult.Unreachable(e.message ?: e.javaClass.simpleName)
        }
    }
}
