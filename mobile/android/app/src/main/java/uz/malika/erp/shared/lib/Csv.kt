package uz.malika.erp.shared.lib

/**
 * CSV builder with RFC-4180 escaping. A field is quoted when it contains a
 * comma, double-quote, CR or LF; inner quotes are doubled. Rows are joined with
 * CRLF. Numbers/money are passed in pre-formatted as strings (the caller owns
 * locale), so this stays business-free.
 */
object Csv {
    fun build(headers: List<String>, rows: List<List<String>>): String =
        (listOf(headers) + rows).joinToString("\r\n") { row ->
            row.joinToString(",") { escape(it) }
        }

    private fun escape(field: String): String =
        if (field.any { it == ',' || it == '"' || it == '\n' || it == '\r' }) {
            "\"" + field.replace("\"", "\"\"") + "\""
        } else {
            field
        }
}
