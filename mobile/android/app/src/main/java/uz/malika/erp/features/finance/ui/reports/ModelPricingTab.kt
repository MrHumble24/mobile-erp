package uz.malika.erp.features.finance.ui.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.ModelPricingRow
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.Async
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.BarChart
import uz.malika.erp.features.finance.ui.components.BarDatum
import uz.malika.erp.features.finance.ui.components.ModelPricingTable
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.ui.EmptyView

/** Model pricing & margins over the rolling 90-day window. */
@Composable
fun ModelPricingTab(vm: FinanceReadsViewModel) {
    val t = LocalT.current
    val canCost = LocalCan.current("device.cost.view")
    val labelsHandle = rememberAsync { vm.deviceModelLabels() }
    val labels = when (val s = labelsHandle.state) {
        is Async.Data -> s.value
        else -> emptyMap()
    }
    val handle = rememberAsync { vm.modelPricing() }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (rows.isEmpty()) {
                EmptyView(t("reports.empty", null))
            } else {
                Body(rows, labels, canCost)
            }
        }
    }
}

@Composable
private fun Body(rows: List<ModelPricingRow>, labels: Map<String, String>, canCost: Boolean) {
    val t = LocalT.current
    BarChart(
        title = t("dashboard.avgSellingPrice", null),
        data = rows.take(8).map { r ->
            BarDatum(labels[r.modelId] ?: r.modelId, parseMoney(r.avgSellingPrice).toDouble())
        },
    )
    ModelPricingTable(rows, labels, canCost)
}
