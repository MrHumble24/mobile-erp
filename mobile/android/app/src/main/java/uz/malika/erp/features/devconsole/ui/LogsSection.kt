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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import uz.malika.erp.core.logging.AppLog
import uz.malika.erp.core.logging.LogEntry
import uz.malika.erp.core.logging.LogLevel
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

private fun levelColor(level: LogLevel) = when (level) {
    LogLevel.D -> Tokens.slate
    LogLevel.I -> Tokens.signalBlue
    LogLevel.W -> Tokens.warning
    LogLevel.E -> Tokens.danger
}

/** null = all levels. */
private fun LogEntry.matches(min: LogLevel?) = min == null || level == min

@Composable
fun LogsSection() {
    val context = LocalContext.current
    val entries by AppLog.entries.collectAsState()
    var search by remember { mutableStateOf("") }
    var level by remember { mutableStateOf<LogLevel?>(null) }

    val shown = entries
        .asReversed()
        .filter { it.matches(level) }
        .filter { search.isBlank() || it.message.contains(search, true) || it.tag.contains(search, true) }

    Column(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            AppTextField(value = search, onValueChange = { search = it }, placeholder = "Search logs", modifier = Modifier.weight(1f))
            PillButton("Share", { shareText(context, shown.joinToString("\n") { line(it) }) }, variant = ButtonVariant.OUTLINE)
            PillButton("Clear", { AppLog.clear() }, variant = ButtonVariant.OUTLINE)
        }
        Spacer(Modifier.height(8.dp))
        SegmentedControl(
            options = listOf(
                SegmentOption<LogLevel?>(null, "All"),
                SegmentOption<LogLevel?>(LogLevel.D, "D"),
                SegmentOption<LogLevel?>(LogLevel.I, "I"),
                SegmentOption<LogLevel?>(LogLevel.W, "W"),
                SegmentOption<LogLevel?>(LogLevel.E, "E"),
            ),
            selected = level,
            onSelect = { level = it },
        )
        Spacer(Modifier.height(8.dp))
        if (shown.isEmpty()) {
            Text("No log entries.", style = MaterialTheme.typography.bodyMedium)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(shown, key = { it.id }) { LogRow(it) }
            }
        }
    }
}

@Composable
private fun LogRow(entry: LogEntry) {
    AppCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            StatusChip(entry.level.name, color = levelColor(entry.level))
            Text(entry.tag, style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
            Text(formatClock(entry.timeMs), style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
        }
        Spacer(Modifier.height(6.dp))
        Text(entry.message, style = MaterialTheme.typography.bodyMedium)
        entry.error?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
    }
}

private fun line(e: LogEntry) = "${formatClock(e.timeMs)} ${e.level} ${e.tag}: ${e.message}${e.error?.let { " | $it" } ?: ""}"
