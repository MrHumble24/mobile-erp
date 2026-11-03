package uz.malika.erp.features.devconsole.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import uz.malika.erp.ui.theme.Tokens
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val clock = SimpleDateFormat("HH:mm:ss.SSS", Locale.US)
private val pretty = Json { prettyPrint = true }

/** `HH:mm:ss.SSS` for a log/network timestamp. */
fun formatClock(epochMs: Long): String = clock.format(Date(epochMs))

/** Chip color for an HTTP status (null/failed → danger). Mirrors the web badges. */
@Composable
fun statusColor(status: Int?): Color = when {
    status == null -> Tokens.danger
    status in 200..299 -> Tokens.success
    status in 300..399 -> Tokens.info
    status in 400..499 -> Tokens.warning
    else -> Tokens.danger
}

/** Pretty-print a JSON body for the detail view; returns the raw text if not JSON. */
fun prettyJson(body: String?): String {
    if (body.isNullOrBlank()) return ""
    return runCatching {
        pretty.encodeToString(JsonElement.serializer(), Json.parseToJsonElement(body))
    }.getOrDefault(body)
}
