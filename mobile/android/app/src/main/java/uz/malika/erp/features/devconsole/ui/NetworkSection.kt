package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.core.logging.NetworkEntry
import uz.malika.erp.core.logging.NetworkLog
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/** Status buckets for the network filter. */
enum class NetFilter { ALL, OK, REDIRECT, CLIENT, SERVER, FAILED }

private fun NetworkEntry.matches(filter: NetFilter): Boolean = when (filter) {
    NetFilter.ALL -> true
    NetFilter.OK -> status in 200..299
    NetFilter.REDIRECT -> status in 300..399
    NetFilter.CLIENT -> status in 400..499
    NetFilter.SERVER -> (status ?: 0) >= 500
    NetFilter.FAILED -> failed
}

@Composable
fun NetworkSection(container: AppContainer) {
    val entries by NetworkLog.entries.collectAsState()
    var search by remember { mutableStateOf("") }
    var filter by remember { mutableStateOf(NetFilter.ALL) }
    var detail by remember { mutableStateOf<NetworkEntry?>(null) }

    val shown = entries
        .asReversed() // newest first
        .filter { it.matches(filter) }
        .filter { search.isBlank() || it.url.contains(search, ignoreCase = true) }

    Column(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AppTextField(value = search, onValueChange = { search = it }, placeholder = "Search URL", modifier = Modifier.weight(1f))
            PillButton("Clear", { NetworkLog.clear() }, variant = ButtonVariant.OUTLINE)
        }
        Spacer(Modifier.height(8.dp))
        SegmentedControl(
            options = listOf(
                SegmentOption(NetFilter.ALL, "All"),
                SegmentOption(NetFilter.OK, "2xx"),
                SegmentOption(NetFilter.REDIRECT, "3xx"),
                SegmentOption(NetFilter.CLIENT, "4xx"),
                SegmentOption(NetFilter.SERVER, "5xx"),
                SegmentOption(NetFilter.FAILED, "Failed"),
            ),
            selected = filter,
            onSelect = { filter = it },
        )
        Spacer(Modifier.height(8.dp))
        if (shown.isEmpty()) {
            Text("No requests captured yet.", style = MaterialTheme.typography.bodyMedium)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(shown, key = { it.id }) { entry ->
                    NetworkRow(entry, onClick = { detail = entry })
                }
            }
        }
    }

    detail?.let { NetworkDetailSheet(it, onDismiss = { detail = null }) }
}
