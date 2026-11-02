package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.core.logging.NetworkEntry
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** One tappable network-log row: method, status, path, duration + time. */
@Composable
fun NetworkRow(entry: NetworkEntry, onClick: () -> Unit) {
    AppCard(Modifier.fillMaxWidth(), onClick = onClick) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        ) {
            StatusChip(entry.method, color = Tokens.slate)
            StatusChip(entry.status?.toString() ?: "ERR", color = statusColor(entry.status))
            Text(
                text = "${entry.durationMs} ms",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.weight(1f),
            )
            Text(formatClock(entry.startMs), style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
        }
        Spacer(Modifier.height(6.dp))
        Text(
            text = entry.path,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}
