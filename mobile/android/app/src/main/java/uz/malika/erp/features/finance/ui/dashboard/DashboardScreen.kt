package uz.malika.erp.features.finance.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.Async
import uz.malika.erp.features.finance.ui.components.financeViewModel
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT

/**
 * Management dashboard (route `dashboard`, auth-only). Each section is gated by
 * the permission its endpoint needs, so a cashier sees only its quick actions,
 * not the finance KPIs. Tables sit side-by-side on tablet widths.
 */
@Composable
fun DashboardScreen(container: AppContainer, onNavigate: (String) -> Unit) {
    val t = LocalT.current
    val can = LocalCan.current
    val vm = financeViewModel(container) { FinanceReadsViewModel(it) }

    val labelsHandle = rememberAsync { vm.deviceModelLabels() }
    val labels = when (val s = labelsHandle.state) {
        is Async.Data -> s.value
        else -> emptyMap()
    }

    BoxWithConstraints(Modifier.fillMaxSize()) {
        val wide = maxWidth >= 800.dp
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(t("dashboard.title", null), style = MaterialTheme.typography.headlineSmall)
            QuickActions(onNavigate)
            if (can("report.finance")) KpiSection(vm)

            val tables = buildList<@Composable () -> Unit> {
                if (can("device.read")) add { LowStockCard(vm, labels) }
                if (can("consignment.read")) add { OverdueCard(vm) }
            }
            if (wide && tables.size == 2) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.Top) {
                    Column(Modifier.weight(1f)) { tables[0]() }
                    Column(Modifier.weight(1f)) { tables[1]() }
                }
            } else {
                tables.forEach { it() }
            }

            if (can("report.finance")) ModelPricingCard(vm, labels)
        }
    }
}
