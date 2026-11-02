package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.app.Destination
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** One label/value line inside a [ReportDrill]. */
data class DrillLine(val label: String, val value: String)

/**
 * A breakdown drill-down: the detail of a tapped report tile or bar. Kept
 * data-driven (title + lines + optional cross-feature jump) rather than a
 * per-kind registry — a tab builds it from the row it already has, so no extra
 * fetch and no `when` chain to grow.
 */
data class ReportDrill(
    val title: String,
    val lines: List<DrillLine>,
    val destination: Destination? = null,
    val actionLabel: String? = null,
)

@Composable
fun ReportDrillSheet(
    drill: ReportDrill,
    onOpen: (Destination) -> Unit,
    onDismiss: () -> Unit,
) {
    val t = LocalT.current
    AppBottomSheet(onDismiss = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(drill.title, style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(4.dp))
            drill.lines.forEach { line ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(line.label, style = MaterialTheme.typography.bodyMedium, color = Tokens.mutedForeground)
                    Text(line.value, style = MaterialTheme.typography.bodyMedium)
                }
            }
            if (drill.destination != null && drill.actionLabel != null) {
                Spacer(Modifier.height(8.dp))
                PillButton(
                    drill.actionLabel,
                    onClick = { onOpen(drill.destination); onDismiss() },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}
