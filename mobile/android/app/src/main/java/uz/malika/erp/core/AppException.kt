package uz.malika.erp.core

import org.json.JSONObject
import retrofit2.HttpException
import java.io.IOException

/**
 * Normalized API failure. Maps the server error envelope
 * `{ statusCode, message: string|string[], error }` into one shape so the UI
 * never parses a raw [HttpException]. A `string[]` message is joined with ", ".
 */
class AppException(
    val statusCode: Int,
    override val message: String,
    val error: String? = null,
) : Exception(message) {

    /** True when the request never reached the server (no connectivity). */
    val isNetwork: Boolean get() = statusCode == 0

    companion object {
        fun fromHttp(e: HttpException): AppException {
            val code = e.code()
            val raw = runCatching { e.response()?.errorBody()?.string() }.getOrNull()
            return parse(code, raw) ?: AppException(code, e.message())
        }

        fun parse(code: Int, body: String?): AppException? {
            if (body.isNullOrBlank()) return null
            return try {
                val json = JSONObject(body)
                val message = when (val m = json.opt("message")) {
                    is org.json.JSONArray ->
                        (0 until m.length()).joinToString(", ") { m.getString(it) }
                    null -> "Request failed"
                    else -> m.toString()
                }
                AppException(code, message, json.optString("error").ifBlank { null })
            } catch (_: Exception) {
                AppException(code, body)
            }
        }
    }
}

/**
 * Run a suspend API call and surface a normalized [AppException] on failure, so
 * every repository catches the same type. The HTTP client handles the 401
 * side-effects (clear session); this only translates the thrown error.
 */
suspend fun <T> runApi(block: suspend () -> T): T = try {
    block()
} catch (e: AppException) {
    throw e
} catch (e: HttpException) {
    throw AppException.fromHttp(e)
} catch (_: IOException) {
    throw AppException(0, "No connection to the server.")
}
