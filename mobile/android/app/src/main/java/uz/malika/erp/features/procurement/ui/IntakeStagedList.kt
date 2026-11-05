package uz.malika.erp.features.procurement.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.procurement.data.IntakeDraft
import uz.malika.erp.features.procurement.data.RegisteredDeviceDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.CaptureSpringItem
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.isNew
import uz.malika.erp.shared.ui.rememberCaptureTracker
import uz.malika.erp.shared.ui.rememberReduceMotion
import uz.malika.erp.ui.theme.Tokens

/**
 * The units staged so far in the intake loop. Each row leads with the mono IMEI,
 * then the model label + acquisition cost, then the spec values; the trailing
 * icon removes that draft. Drafts live in [ShipmentsViewModel]; this is pure
 * presentation of the list it owns.
 */
@Composable
fun IntakeStagedList(
    drafts: List<IntakeDraft>,
    modelNames: Map<String, String>,
    onRemove: (Int) -> Unit,
) {
    val t = LocalT.current
    val tracker = rememberCaptureTracker()
    val reduceMotion = rememberReduceMotion()
    Column {
        Text(
            "${t("shipments.deviceList", null)} (${drafts.size})",
            style = MaterialTheme.typography.titleMedium,
        )
        Spacer(Modifier.height(Tokens.Space.rowV))
        drafts.forEachIndexed { i, d ->
            key(d.imei) {
                CaptureSpringItem(
                    isNew = tracker.isNew(d.imei),
                    pulse = drafts.size,
                    reduceMotion = reduceMotion,
                ) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            ImeiText(d.imei, style = MaterialTheme.typography.bodyMedium)
                            Row(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.gap)) {
                                Text(modelNames[d.modelId] ?: d.modelId, style = MaterialTheme.typography.bodySmall)
                                MoneyText(d.acquisitionCost.toString(), style = MaterialTheme.typography.bodySmall)
                            }
                            if (d.specs.values.any { it.isNotBlank() }) {
                                Text(
                                    d.specs.values.filter { it.isNotBlank() }.joinToString(" · "),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Tokens.slate,
                                )
                            }
                        }
                        IconButton(onClick = { onRemove(i) }) {
                            Icon(Icons.Outlined.Close, contentDescription = t("common.delete", null))
                        }
                    }
                }
            }
        }
    }
}

/**
 * Per-device result after a batch is registered: landed cost on the right and
 * the server-stamped customs fee beneath it (shown when the server sent it).
 */
@Composable
fun LandedResults(results: List<RegisteredDeviceDto>) {
    val t = LocalT.current
    AppCard {
        Text(t("shipments.landedCostResults", null), style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(Tokens.Space.rowV))
        results.forEach { r ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                ImeiText(r.imei, style = MaterialTheme.typography.bodySmall)
                MoneyText(r.landedCost, style = MaterialTheme.typography.bodySmall)
            }
            r.customsFee?.let { fee ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(t("inventory.customsFee", null), style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
                    MoneyText(fee, style = MaterialTheme.typography.bodySmall.copy(color = Tokens.mutedForeground))
                }
            }
            Spacer(Modifier.height(Tokens.Space.rowV))
        }
    }
}
