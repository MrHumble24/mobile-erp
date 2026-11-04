package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.ModelPricingRow
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.Async
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BarChart
import uz.malika.erp.features.finance.ui.components.BarDatum
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Model pricing & margins over the rolling 90-day window: an average-price
 * bar card, then one card per model/storage with keyed facts. Acquisition
 * cost and margin appear only with `device.cost.view`.
 */
@Composable
fun ModelPricingTab(vm: FinanceReadsViewModel) {
    val t = LocalT.current
    val canCost = LocalCan.current("device.cost.view")
    val labelsHandle = rememberAsync { vm.deviceModelLabels() }
    val labels = (labelsHandle.state as? Async.Data)?.value ?: emptyMap()
    val handle = rememberAsync { vm.modelPricing() }
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, bottom = Tokens.Space.lg),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
    ) {
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (rows.isEmpty()) {
                AppCard(Modifier.fillMaxWidth()) { EmptyView(t("reports.empty", null), compact = true) }
            } else {
                BarChart(
                    title = t("dashboard.avgSellingPrice", null),
                    data = rows.take(8).map { r -> BarDatum("${labels[r.modelId] ?: r.modelId} ${r.storage.orEmpty()}", parseMoney(r.avgSellingPrice ?: "0").toDouble()) },
                )
                rows.forEach { r -> PricingCard(r, labels[r.modelId] ?: r.modelId, canCost) }
            }
        }
    }
}

/** One model's pricing: name + mono storage, stock/sold caption, keyed facts. */
@Composable
private fun PricingCard(r: ModelPricingRow, name: String, canCost: Boolean) {
    val t = LocalT.current
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)
    AppCard(Modifier.fillMaxWidth()) {
        Text(name, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
        r.storage?.let { Text(it, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.muted) }
        Text(
            "${t("dashboard.unitsInStock", null)} ${r.unitsInStock} · ${t("dashboard.unitsSold", null)} ${r.unitsSold}",
            style = MaterialTheme.typography.bodySmall,
            color = Tokens.muted,
        )
        Spacer(Modifier.height(Tokens.Space.md))
        if (canCost) {
            FactRow(t("dashboard.avgAcquisitionCost", null)) { Text(r.avgAcquisitionCost?.let(::formatMoney) ?: "—", style = mono) }
        }
        FactRow(t("dashboard.avgSellingPrice", null), last = !canCost) { Text(r.avgSellingPrice?.let(::formatMoney) ?: "—", style = mono) }
        if (canCost) {
            val selling = r.avgSellingPrice?.let { parseMoney(it).toDouble() }
            val cost = r.avgAcquisitionCost?.let { parseMoney(it).toDouble() }
            FactRow(t("reports.margin", null), last = true) {
                if (selling != null && cost != null && selling > 0) {
                    val spread = selling - cost
                    Text(
                        "${moneyOf(spread)} · ${"%.1f".format(spread / selling * 100)}%",
                        style = mono.copy(color = if (spread >= 0) Tokens.success else Tokens.danger),
                    )
                } else {
                    Text("—", style = mono)
                }
            }
        }
    }
}
