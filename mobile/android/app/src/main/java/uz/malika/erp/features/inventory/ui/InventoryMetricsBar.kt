package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.model.DeviceMetrics
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Status filter chips above the device list — one row of pills, each a status
 * with its count in mono. Tapping a status toggles the list filter; the selected
 * chip wears the status pill pair (hue on tint), the rest sit as white cards.
 * The low-stock chip is a jump to the Alerts tab, not a filter. Scrolls
 * edge-to-edge with the screen gutter as content padding.
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
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
        contentPadding = PaddingValues(horizontal = Tokens.Space.screenH),
    ) {
        item {
            StatusCountChip(t("inventory.metricsTotal", null), metrics.total, Tokens.text,
                selected = selectedStatus == null) { onSelectStatus(null) }
        }
        item {
            StatusCountChip(t("inventory.metricsInStock", null), metrics.inStock, Tokens.success,
                selected = selectedStatus == "IN_STOCK") { onToggleStatus("IN_STOCK") }
        }
        item {
            StatusCountChip(t("inventory.metricsDefective", null), metrics.defective, Tokens.danger,
                selected = selectedStatus == "DEFECTIVE") { onToggleStatus("DEFECTIVE") }
        }
        item {
            StatusCountChip(t("inventory.metricsConsigned", null), metrics.consigned, Tokens.info,
                selected = selectedStatus == "CONSIGNED") { onToggleStatus("CONSIGNED") }
        }
        item {
            StatusCountChip(t("inventory.metricsLowStock", null), lowStockCount, Tokens.warning,
                selected = false, onTap = onShowAlerts)
        }
    }
}

@Composable
private fun StatusCountChip(
    label: String,
    value: Int?,
    hue: Color,
    selected: Boolean,
    onTap: () -> Unit,
) {
    val fill = if (selected) hue.copy(alpha = 0.14f) else Tokens.card
    val labelColor = if (selected) hue else Tokens.muted
    val countColor = if (selected) hue else Tokens.text
    Row(
        Modifier
            .clip(RoundedCornerShape(Tokens.Radius.pill))
            .background(fill)
            .clickable(onClick = onTap)
            .height(40.dp)
            .padding(horizontal = Tokens.Space.lg),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = labelColor, maxLines = 1)
        Text(
            value?.toString() ?: "—",
            style = MaterialTheme.typography.labelMedium.copy(fontFamily = MonoFamily),
            color = countColor,
            maxLines = 1,
        )
    }
}
