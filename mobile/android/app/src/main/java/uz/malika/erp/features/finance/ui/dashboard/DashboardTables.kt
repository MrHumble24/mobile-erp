package uz.malika.erp.features.finance.ui.dashboard

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.LowStockItem
import uz.malika.erp.features.finance.data.OverdueConsignment
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.ModelPricingTable
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppDataTable
import uz.malika.erp.shared.ui.EmptyView

private fun dayOf(iso: String): String = iso.substringBefore('T')

/** Low-stock alerts (`/stock-alert-rules/low-stock`, perm `device.read`). */
@Composable
fun LowStockCard(vm: FinanceReadsViewModel, labels: Map<String, String>) {
    val t = LocalT.current
    SectionCard(t("dashboard.lowStockTitle", null)) {
        val handle = rememberAsync { vm.lowStock() }
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (rows.isEmpty()) EmptyView(t("common.notFound", null), compact = true)
            else AppDataTable(
                columns = listOf(
                    t("inventory.model", null), t("inventory.storage", null),
                    t("dashboard.currentCount", null), t("dashboard.threshold", null),
                ),
                rows = rows,
                columnWidths = listOf(150, 90, 90, 80),
                cell = { r: LowStockItem, c ->
                    when (c) {
                        0 -> labels[r.modelId] ?: r.modelId
                        1 -> r.storage
                        2 -> r.currentCount.toString()
                        else -> r.threshold.toString()
                    }
                },
            )
        }
    }
}

/** Overdue consignments (`/consignments/overdue`, perm `consignment.read`). */
@Composable
fun OverdueCard(vm: FinanceReadsViewModel) {
    val t = LocalT.current
    SectionCard(t("dashboard.overdueConsignmentsTitle", null)) {
        val handle = rememberAsync { vm.overdue() }
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (rows.isEmpty()) EmptyView(t("common.notFound", null), compact = true)
            else AppDataTable(
                columns = listOf(
                    t("consignments.partner", null), t("consignments.device", null),
                    t("consignments.agreedPrice", null), t("consignments.dueDate", null),
                ),
                rows = rows,
                columnWidths = listOf(150, 150, 120, 120),
                cell = { r: OverdueConsignment, c ->
                    when (c) {
                        0 -> r.partnerShopName
                        1 -> r.imei
                        2 -> formatMoney(r.agreedPrice)
                        else -> dayOf(r.dueDate)
                    }
                },
            )
        }
    }
}

/** Model pricing & margins (`/reports/model-pricing`). Cost needs `device.cost.view`. */
@Composable
fun ModelPricingCard(vm: FinanceReadsViewModel, labels: Map<String, String>) {
    val t = LocalT.current
    val canCost = LocalCan.current("device.cost.view")
    SectionCard(t("dashboard.modelPricingTitle", null)) {
        val handle = rememberAsync { vm.modelPricing() }
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (rows.isEmpty()) EmptyView(t("common.notFound", null), compact = true)
            else ModelPricingTable(rows, labels, canCost)
        }
    }
}

@Composable
private fun SectionCard(title: String, content: @Composable () -> Unit) {
    AppCard(Modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.labelLarge)
        Spacer(Modifier.height(12.dp))
        content()
    }
}
