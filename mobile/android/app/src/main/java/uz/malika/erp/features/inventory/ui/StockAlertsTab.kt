package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.data.LowStockView
import uz.malika.erp.features.inventory.data.StockAlertRuleView
import uz.malika.erp.features.inventory.model.Async
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.features.inventory.model.StockAlertsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Alerts tab: low-stock list + alert-rule management (writes need `settings.manage`). */
@Composable
fun StockAlertsTab(
    alertsVm: StockAlertsViewModel,
    catalogVm: CatalogViewModel,
    canManage: Boolean,
    online: Boolean,
) {
    val t = LocalT.current
    val rulesState by alertsVm.rules.collectAsState()
    val lowStock by alertsVm.lowStock.collectAsState()
    val models = catalogVm.models.collectAsState().value.valueOrNull ?: emptyList()
    var editing by remember { mutableStateOf<StockAlertRuleView?>(null) }
    var creating by remember { mutableStateOf(false) }

    fun nameOf(id: String) = models.firstOrNull { it.id == id }?.label ?: id

    Box(Modifier.fillMaxSize()) {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (lowStock.isNotEmpty()) {
                item { LowStockHeader() }
                items(lowStock, key = { "low-${it.id}" }) { r -> LowStockRow(r, ::nameOf) }
                item { Spacer(Modifier.height(8.dp)) }
            }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(t("inventory.rulesTitle", null), style = MaterialTheme.typography.labelLarge)
                    if (canManage) PillButton(text = t("inventory.newRule", null), onClick = { creating = true })
                }
            }
            when (val s = rulesState) {
                is Async.Loading -> item { Box(Modifier.fillMaxWidth().height(160.dp)) { Loading() } }
                is Async.Error -> item {
                    Box(Modifier.fillMaxWidth().height(200.dp)) {
                        ErrorView(message = s.message, retryLabel = t("common.retry", null), onRetry = alertsVm::refresh)
                    }
                }
                is Async.Data -> if (s.value.isEmpty()) {
                    item { Text(t("inventory.empty", null), style = MaterialTheme.typography.bodyMedium) }
                } else {
                    items(s.value, key = { "rule-${it.id}" }) { r ->
                        RuleRow(r, ::nameOf, onClick = if (canManage) ({ editing = r }) else null)
                    }
                }
            }
        }
    }

    if (creating) {
        AppBottomSheet(onDismiss = { creating = false }) {
            AlertRuleForm(rule = null, alertsVm = alertsVm, models = models, online = online, onSaved = { creating = false })
        }
    }
    editing?.let { rule ->
        AppBottomSheet(onDismiss = { editing = null }) {
            AlertRuleForm(rule = rule, alertsVm = alertsVm, models = models, online = online, onSaved = { editing = null })
        }
    }
}

@Composable
private fun LowStockHeader() {
    val t = LocalT.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Outlined.WarningAmber, contentDescription = null, tint = Tokens.danger, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(6.dp))
        Text(t("inventory.lowStock", null), style = MaterialTheme.typography.labelLarge, color = Tokens.danger)
    }
}

@Composable
private fun LowStockRow(row: LowStockView, nameOf: (String) -> String) {
    AppCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("${nameOf(row.modelId)} · ${row.storage}", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
            Text(
                "${row.currentCount} / ${row.threshold}",
                style = MaterialTheme.typography.titleMedium,
                color = if (row.isBelow) Tokens.danger else Tokens.foreground,
            )
        }
    }
}

@Composable
private fun RuleRow(rule: StockAlertRuleView, nameOf: (String) -> String, onClick: (() -> Unit)?) {
    AppCard(onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("${nameOf(rule.modelId)} · ${rule.storage}", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
            Text("${rule.threshold}", style = MaterialTheme.typography.titleMedium)
        }
    }
}
