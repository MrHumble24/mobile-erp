package uz.malika.erp.features.finance.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.FactCheck
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.Handshake
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.PointOfSale
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.malika.erp.app.Destination
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.ProfitReport
import uz.malika.erp.features.finance.model.DashPeriod
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.model.isoDate
import uz.malika.erp.features.finance.model.periodStart
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.signedEmphasis
import uz.malika.erp.ui.theme.Tokens
import java.util.Date

private data class Shortcut(
    val destination: Destination,
    val labelKey: String,
    val icon: ImageVector,
    val permission: String,
)

/**
 * Cross-feature quick jumps as a One UI-style shortcut row: a rounded-square icon
 * tile per destination with its label below. Icons mirror the nav registry so a
 * shortcut reads the same as the bottom bar / More page. Each is permission-gated
 * and routed through the shared [FeatureNav] bus.
 */
@Composable
fun QuickActions(onOpen: (Destination) -> Unit) {
    val t = LocalT.current
    val can = LocalCan.current
    val shortcuts = listOf(
        Shortcut(Destination.Pos(), "nav.pos", Icons.Outlined.PointOfSale, "sale.create"),
        Shortcut(Destination.Inventory(), "nav.inventory", Icons.Outlined.Inventory2, "device.read"),
        Shortcut(Destination.Qc(), "nav.qc", Icons.AutoMirrored.Outlined.FactCheck, "qc.read"),
        Shortcut(Destination.Sales(), "nav.sales", Icons.AutoMirrored.Outlined.ReceiptLong, "sale.read"),
        Shortcut(Destination.Consignments(), "nav.consignments", Icons.Outlined.Handshake, "consignment.read"),
    ).filter { can(it.permission) }
    if (shortcuts.isEmpty()) return
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(Tokens.Space.gap)) {
        shortcuts.forEach { s ->
            ShortcutTile(t(s.labelKey, null), s.icon, Modifier.weight(1f)) { onOpen(s.destination) }
        }
    }
}

@Composable
private fun ShortcutTile(label: String, icon: ImageVector, modifier: Modifier, onClick: () -> Unit) {
    Column(
        modifier.clip(RoundedCornerShape(14.dp)).clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.gap),
    ) {
        Box(
            Modifier.size(52.dp).clip(RoundedCornerShape(14.dp)).background(Tokens.surface2),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = Tokens.foreground, modifier = Modifier.size(24.dp))
        }
        Text(
            label,
            style = MaterialTheme.typography.labelMedium.copy(fontSize = 12.sp),
            color = Tokens.foreground,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
        )
    }
}

/** Revenue/profit KPI tiles with a today/week/month toggle (`/reports/profit`). */
@Composable
fun KpiSection(vm: FinanceReadsViewModel) {
    val t = LocalT.current
    var period by remember { mutableStateOf(DashPeriod.TODAY) }
    Column(Modifier.fillMaxWidth()) {
        SegmentedControl(
            options = listOf(
                SegmentOption(DashPeriod.TODAY, t("dashboard.periodToday", null)),
                SegmentOption(DashPeriod.WEEK, t("dashboard.periodWeek", null)),
                SegmentOption(DashPeriod.MONTH, t("dashboard.periodMonth", null)),
            ),
            selected = period,
            onSelect = { period = it },
        )
        Spacer(Modifier.height(Tokens.Space.gap))
        val now = remember { Date() }
        val from = isoDate(periodStart(period, now))
        val to = isoDate(now)
        val handle = rememberAsync(period) { vm.profit(from, to) }
        AsyncContent(handle, retryLabel = t("common.retry", null)) { p -> KpiTiles(p) }
    }
}

@Composable
private fun KpiTiles(p: ProfitReport) {
    val t = LocalT.current
    MetricGrid(
        tiles = listOf(
            { m ->
                MetricTile(
                    t("dashboard.grossProfit", null), p.grossProfit, m,
                    subtext = "${p.unitsSold} ${t("dashboard.unitsSold", null)}",
                )
            },
            { m ->
                MetricTile(
                    t("dashboard.netOperatingIncome", null), p.netOperatingIncome, m,
                    emphasis = signedEmphasis(p.netOperatingIncome),
                )
            },
            { m ->
                MetricTile(
                    t("dashboard.revenue", null), p.revenue, m,
                    subtext = "${t("dashboard.retail", null)}: ${formatMoney(p.byChannel.retail)}",
                )
            },
            { m -> MetricTile(t("dashboard.expenses", null), p.expenses, m, emphasis = Tokens.danger) },
        ),
    )
}
