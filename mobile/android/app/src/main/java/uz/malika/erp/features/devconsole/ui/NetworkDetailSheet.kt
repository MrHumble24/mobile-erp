package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import uz.malika.erp.core.logging.NetworkEntry
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private enum class DetailTab { REQUEST, RESPONSE, HEADERS }

/** Full captured exchange with Request/Response/Headers tabs + copy/share. */
@Composable
fun NetworkDetailSheet(entry: NetworkEntry, onDismiss: () -> Unit) {
    val context = LocalContext.current
    var tab by remember { mutableStateOf(DetailTab.REQUEST) }

    AppBottomSheet(onDismiss = onDismiss) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp).padding(bottom = 24.dp)) {
            Text("${entry.method}  ${entry.status ?: "FAILED"}", style = MaterialTheme.typography.titleMedium)
            Text(entry.url, style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                SegmentedControl(
                    options = listOf(
                        SegmentOption(DetailTab.REQUEST, "Request"),
                        SegmentOption(DetailTab.RESPONSE, "Response"),
                        SegmentOption(DetailTab.HEADERS, "Headers"),
                    ),
                    selected = tab,
                    onSelect = { tab = it },
                )
            }
            Spacer(Modifier.height(12.dp))
            MonoBlock(tabBody(entry, tab))
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PillButton("Copy", { copyToClipboard(context, "exchange", tabBody(entry, tab)) }, Modifier.weight(1f), ButtonVariant.OUTLINE)
                PillButton("Share", { shareText(context, NetworkExport.toText(entry)) }, Modifier.weight(1f), ButtonVariant.OUTLINE)
                PillButton("cURL", { shareText(context, NetworkExport.toCurl(entry)) }, Modifier.weight(1f), ButtonVariant.OUTLINE)
            }
        }
    }
}

private fun tabBody(entry: NetworkEntry, tab: DetailTab): String = when (tab) {
    DetailTab.REQUEST -> prettyJson(entry.requestBody).ifBlank { "(no request body)" }
    DetailTab.RESPONSE -> entry.error?.let { "error: $it" } ?: prettyJson(entry.responseBody).ifBlank { "(no response body)" }
    DetailTab.HEADERS -> headerDump("request", entry.requestHeaders) + "\n\n" + headerDump("response", entry.responseHeaders)
}

private fun headerDump(label: String, headers: Map<String, String>): String =
    "── $label ──\n" + headers.entries.joinToString("\n") { "${it.key}: ${it.value}" }.ifBlank { "(none)" }

@Composable
private fun MonoBlock(text: String) {
    Column(
        Modifier.fillMaxWidth().heightIn(max = 320.dp).verticalScroll(rememberScrollState()).horizontalScroll(rememberScrollState()),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily, color = Tokens.foreground),
        )
    }
}
