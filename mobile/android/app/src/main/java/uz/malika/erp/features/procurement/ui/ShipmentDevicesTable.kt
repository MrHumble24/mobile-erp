package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.procurement.data.DeviceRowDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.isCompactWidth
import uz.malika.erp.ui.theme.Tokens

/** The registered-devices list for a shipment: stacked rows on phones, a table on wide panes. */
@Composable
internal fun ShipmentDevicesTable(rows: List<DeviceRowDto>, modelNames: Map<String, String>) {
    val t = LocalT.current
    val showCost = rows.any { it.landedCost != null }
    if (isCompactWidth()) {
        Column {
            rows.forEach { d ->
                Column(Modifier.fillMaxWidth().padding(vertical = 10.dp)) {
                    ImeiText(d.code, style = MaterialTheme.typography.bodyMedium)
                    d.imei2?.takeIf { it.isNotBlank() }?.let {
                        ImeiText(it, style = MaterialTheme.typography.bodySmall.copy(color = Tokens.mutedForeground))
                    }
                    Text(
                        modelNames[d.modelId] ?: d.modelId,
                        style = MaterialTheme.typography.bodySmall,
                        color = Tokens.mutedForeground,
                    )
                    Row(
                        Modifier.fillMaxWidth().padding(top = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        StatusChip(
                            label = t(DeviceStatusMeta.labelKey(d.statusCode), null),
                            color = DeviceStatusMeta.color(d.statusCode),
                        )
                        if (showCost && d.landedCost != null) {
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    "${t("inventory.landedCost", null)}:",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Tokens.mutedForeground,
                                )
                                MoneyText(
                                    d.landedCost,
                                    style = MaterialTheme.typography.bodySmall.copy(color = Tokens.mutedForeground),
                                )
                            }
                        }
                    }
                }
                HorizontalDivider(color = Tokens.border)
            }
        }
        return
    }
    Column {
        Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(t("catalog.unitCode", null), style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1.4f))
            Text(t("common.status", null), style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
            if (showCost) {
                Text(t("inventory.landedCost", null), style = MaterialTheme.typography.labelLarge, modifier = Modifier.weight(1f))
            }
        }
        HorizontalDivider(color = Tokens.border)
        rows.forEach { d ->
            Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.weight(1.4f)) {
                    ImeiText(d.code, style = MaterialTheme.typography.bodyMedium)
                    d.imei2?.takeIf { it.isNotBlank() }?.let {
                        ImeiText(it, style = MaterialTheme.typography.bodySmall.copy(color = Tokens.mutedForeground))
                    }
                    Text(modelNames[d.modelId] ?: d.modelId, style = MaterialTheme.typography.bodySmall)
                }
                Row(Modifier.weight(1f)) {
                    StatusChip(
                        label = t(DeviceStatusMeta.labelKey(d.statusCode), null),
                        color = DeviceStatusMeta.color(d.statusCode),
                    )
                }
                if (showCost) {
                    MoneyText(d.landedCost, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                }
            }
            HorizontalDivider(color = Tokens.border)
        }
    }
}
