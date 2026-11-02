package uz.malika.erp.features.devconsole.ui

import uz.malika.erp.core.logging.NetworkEntry

/** Pure renderers for sharing a captured exchange (already masked). */
object NetworkExport {

    /** A reproducible-ish cURL command (secrets already masked in the entry). */
    fun toCurl(e: NetworkEntry): String = buildString {
        append("curl -X ").append(e.method).append(" '").append(e.url).append('\'')
        e.requestHeaders.forEach { (k, v) -> append(" \\\n  -H '").append(k).append(": ").append(v).append('\'') }
        e.requestBody?.takeIf { it.isNotBlank() }?.let {
            append(" \\\n  --data '").append(it).append('\'')
        }
    }

    /** A plain-text dump of the whole exchange for sharing. */
    fun toText(e: NetworkEntry): String = buildString {
        appendLine("${e.method} ${e.url}")
        appendLine("status: ${e.status ?: "FAILED"}  (${e.durationMs} ms)")
        e.error?.let { appendLine("error: $it") }
        appendLine()
        appendLine("── request headers ──")
        e.requestHeaders.forEach { (k, v) -> appendLine("$k: $v") }
        e.requestBody?.let { appendLine().appendLine("── request body ──").appendLine(it) }
        appendLine()
        appendLine("── response headers ──")
        e.responseHeaders.forEach { (k, v) -> appendLine("$k: $v") }
        e.responseBody?.let { appendLine().appendLine("── response body ──").appendLine(it) }
    }
}
