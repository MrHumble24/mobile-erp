package uz.malika.erp.core.logging

/** Severity of an [AppLog] entry; drives the level chip color in the console. */
enum class LogLevel { D, I, W, E }

/** One in-memory app-log line. */
data class LogEntry(
    val id: Long,
    val timeMs: Long,
    val level: LogLevel,
    val tag: String,
    val message: String,
    val error: String? = null,
)

/**
 * One captured HTTP exchange. Headers/bodies are already masked and truncated
 * by the interceptor before this is stored (never the raw secrets).
 */
data class NetworkEntry(
    val id: Long,
    val startMs: Long,
    val method: String,
    val url: String,
    val path: String,
    val requestHeaders: Map<String, String>,
    val requestBody: String?,
    val status: Int?, // null = the request never got a response (failure)
    val responseHeaders: Map<String, String>,
    val responseBody: String?,
    val durationMs: Long,
    val error: String? = null,
) {
    val failed: Boolean get() = status == null || error != null
}
