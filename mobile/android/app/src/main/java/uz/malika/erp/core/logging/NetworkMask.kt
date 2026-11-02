package uz.malika.erp.core.logging

/**
 * Keeps secrets out of the captured network log. Pure string logic (unit-tested):
 *  - the `Authorization` header value is replaced with `***`,
 *  - any JSON `"password": "..."` value is replaced with `***`,
 *  - bodies are truncated at 64 KB so a huge payload can't blow up the buffer.
 */
object NetworkMask {

    const val MAX_BODY = 64 * 1024

    private val passwordRegex = Regex("(\"password\"\\s*:\\s*)\"(?:\\\\.|[^\"\\\\])*\"")

    fun maskHeaders(headers: Map<String, String>): Map<String, String> =
        headers.mapValues { (name, value) ->
            if (name.equals("Authorization", ignoreCase = true)) "***" else value
        }

    fun maskBody(body: String?): String? =
        body?.let { passwordRegex.replace(it) { m -> "${m.groupValues[1]}\"***\"" } }

    fun truncate(body: String?): String? = when {
        body == null -> null
        body.length <= MAX_BODY -> body
        else -> body.take(MAX_BODY) + "… [truncated ${body.length - MAX_BODY} chars]"
    }

    /** Mask then truncate a body, in that order. */
    fun scrub(body: String?): String? = truncate(maskBody(body))
}
