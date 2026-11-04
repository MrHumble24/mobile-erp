package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
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
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.data.LowStockView
import uz.malika.erp.features.inventory.data.StockAlertRuleView
import uz.malika.erp.features.inventory.model.Async
import uz.malika.erp.features.inventory.model.CatalogViewModel
import uz.malika.erp.features.inventory.model.StockAlertsViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Alerts tab: the models currently under their minimum (danger count pill),
 * then the alert rules as cards; the one orange is "Yangi qoida". Rule writes
 * need `settings.manage`.
 */
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

    Box(Modifier.fillMaxSize().padding(horizontal = Tokens.Space.screenH)) {
        LazyColumn(verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg), contentPadding = listBottomPadding()) {
            if (lowStock.isNotEmpty()) {
                item { SectionHeading(t("inventory.lowStock", null)) }
                items(lowStock, key = { "low-${it.id}" }) { r -> LowStockRow(r, nameOf(r.modelId)) }
                item { Spacer(Modifier.height(Tokens.Space.xs)) }
            }
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    SectionHeading(t("inventory.rulesTitle", null))
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
                    item { AppCard(Modifier.fillMaxWidth()) { EmptyView(t("common.notFound", null), compact = true) } }
                } else {
                    items(s.value, key = { "rule-${it.id}" }) { r ->
                        RuleRow(r, nameOf(r.modelId), onClick = if (canManage) ({ editing = r }) else null)
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
private fun SectionHeading(text: String) {
    Text(text, style = MaterialTheme.typography.titleMedium, color = Tokens.text)
}

/** Model + storage left; the live count against its minimum as a danger pill right. */
@Composable
private fun LowStockRow(row: LowStockView, name: String) {
    AppCard(Modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            ModelLine(name, row.storage, Modifier.weight(1f))
            Spacer(Modifier.width(Tokens.Space.gap))
            StatusChip(
                "${row.currentCount} / ${row.threshold}",
                color = if (row.isBelow) Tokens.danger else Tokens.success,
            )
        }
    }
}

/** Model + storage left; the minimum threshold in mono right, labelled once. */
@Composable
private fun RuleRow(rule: StockAlertRuleView, name: String, onClick: (() -> Unit)?) {
    val t = LocalT.current
    AppCard(Modifier.fillMaxWidth(), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            ModelLine(name, rule.storage, Modifier.weight(1f))
            Spacer(Modifier.width(Tokens.Space.gap))
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    "${rule.threshold}",
                    style = MaterialTheme.typography.titleMedium.copy(fontFamily = MonoFamily),
                    color = Tokens.text,
                )
                Text(t("inventory.threshold", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            }
        }
    }
}

@Composable
private fun ModelLine(name: String, storage: String, modifier: Modifier) {
    Column(modifier) {
        Text(name, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
        Text(storage, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted)
    }
}
