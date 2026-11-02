package uz.malika.erp.data.remote

import okhttp3.Headers
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import okio.Buffer
import uz.malika.erp.core.logging.NetworkEntry
import uz.malika.erp.core.logging.NetworkLog
import uz.malika.erp.core.logging.NetworkMask
import java.io.IOException

/**
 * Captures every HTTP exchange into [NetworkLog] for the Developer Console:
 * method, full URL + path, masked headers, scrubbed + truncated bodies, status,
 * duration, and the error message on failure. Added last in [HttpClient] so it
 * sees the final request (after the base-URL rewrite and the bearer header).
 */
fun networkLogInterceptor() = Interceptor { chain ->
    val request = chain.request()
    val id = NetworkLog.nextId()
    val startMs = System.currentTimeMillis()

    val response: Response = try {
        chain.proceed(request)
    } catch (e: IOException) {
        NetworkLog.record(entry(id, startMs, request, null, System.currentTimeMillis(), e.message ?: "network error"))
        throw e
    }

    val responseBody = runCatching { response.peekBody(NetworkMask.MAX_BODY.toLong()).string() }.getOrNull()
    NetworkLog.record(
        entry(id, startMs, request, response, System.currentTimeMillis(), null, responseBody),
    )
    response
}

private fun entry(
    id: Long,
    startMs: Long,
    request: Request,
    response: Response?,
    endMs: Long,
    error: String?,
    responseBody: String? = null,
) = NetworkEntry(
    id = id,
    startMs = startMs,
    method = request.method,
    url = request.url.toString(),
    path = request.url.encodedPath,
    requestHeaders = NetworkMask.maskHeaders(request.headers.toMap()),
    requestBody = NetworkMask.scrub(request.bodyString()),
    status = response?.code,
    responseHeaders = response?.headers?.toMap() ?: emptyMap(),
    responseBody = NetworkMask.scrub(responseBody),
    durationMs = endMs - startMs,
    error = error,
)

private fun Headers.toMap(): Map<String, String> =
    names().associateWith { values(it).joinToString(", ") }

private fun Request.bodyString(): String? = body?.let { b ->
    runCatching {
        val buffer = Buffer()
        b.writeTo(buffer)
        buffer.readUtf8()
    }.getOrNull()
}
