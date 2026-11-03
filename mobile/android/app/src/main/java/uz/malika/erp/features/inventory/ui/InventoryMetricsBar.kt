package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.background
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.model.DeviceMetrics
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.Tokens

/**
 * Metrics strip above the device list. Status cards toggle the list filter; the
 * low-stock card jumps to the Alerts tab. Scrolls edge-to-edge with a screen-gutter
 * content padding so the first/last tile sit on the 16dp margin (never clipped).
 */
@Composable
fun InventoryMetricsBar(
    metrics: DeviceMetrics,
    lowStockCount: Int?,
    selectedStatus: String?,
    onSelectStatus: (String?) -> Unit,
    onToggleStatus: (String) -> Unit,
    onShowAlerts: () -> Unit,
) {
    val t = LocalT.current
    LazyRow(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = Tokens.Space.screenH),
    ) {
        item {
            MetricCard(t("inventory.metricsTotal", null), metrics.total, Tokens.onyx,
                active = selectedStatus == null) { onSelectStatus(null) }
        }
        item {
            MetricCard(t("inventory.metricsInStock", null), metrics.inStock, Tokens.success,
                active = selectedStatus == "IN_STOCK") { onToggleStatus("IN_STOCK") }
        }
        item {
            MetricCard(t("inventory.metricsDefective", null), metrics.defective, Tokens.danger,
                active = selectedStatus == "DEFECTIVE") { onToggleStatus("DEFECTIVE") }
        }
        item {
            MetricCard(t("inventory.metricsConsigned", null), metrics.consigned, Tokens.signalBlue,
                active = selectedStatus == "CONSIGNED") { onToggleStatus("CONSIGNED") }
        }
        item {
            MetricCard(t("inventory.metricsLowStock", null), lowStockCount, Tokens.warning,
                active = false, onTap = onShowAlerts)
        }
    }
}

@Composable
private fun MetricCard(
    label: String,
    value: Int?,
    dot: Color,
    active: Boolean,
    onTap: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Tokens.surfaceCanvas,
        modifier = Modifier
            .width(130.dp)
            .border(
                BorderStroke(if (active) 1.5.dp else 1.dp, if (active) Tokens.onyx else Tokens.border),
                RoundedCornerShape(12.dp),
            )
            .clickable(onClick = onTap),
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    label,
                    style = MaterialTheme.typography.labelSmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                Box(Modifier.size(10.dp).background(dot, CircleShape))
            }
            Spacer(Modifier.height(6.dp))
            Text(value?.toString() ?: "—", style = MaterialTheme.typography.headlineSmall)
        }
    }
}
