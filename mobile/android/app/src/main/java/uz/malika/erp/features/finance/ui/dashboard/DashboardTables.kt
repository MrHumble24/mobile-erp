package uz.malika.erp.features.finance.ui.dashboard

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.finance.data.LowStockItem
import uz.malika.erp.features.finance.data.ModelPricingRow
import uz.malika.erp.features.finance.data.OverdueConsignment
import uz.malika.erp.features.finance.model.FinanceReadsViewModel
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private fun dayOf(iso: String): String = iso.substringBefore('T')

/**
 * Low-stock alerts (`/stock-alert-rules/low-stock`, perm `device.read`). A row
 * list (mirrors iOS): model + storage left, the count as a danger pill against
 * its threshold right — nothing scrolls sideways inside the card.
 */
@Composable
fun LowStockCard(vm: FinanceReadsViewModel, labels: Map<String, String>) {
    val t = LocalT.current
    SectionCard(t("dashboard.lowStockTitle", null)) {
        val handle = rememberAsync { vm.lowStock() }
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (rows.isEmpty()) EmptyView(t("common.notFound", null), compact = true)
            else RowList(rows) { r -> LowStockRow(r, labels[r.modelId] ?: r.modelId) }
        }
    }
}

@Composable
private fun LowStockRow(r: LowStockItem, name: String) {
    Row(
        Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TitleWithCaption(name, r.storage, Modifier.weight(1f))
        Spacer(Modifier.width(Tokens.Space.gap))
        StatusChip(r.currentCount.toString(), color = Tokens.danger)
        Spacer(Modifier.width(Tokens.Space.xs))
        Text(
            "/ ${r.threshold}",
            style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily),
            color = Tokens.muted,
        )
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
            else RowList(rows) { r -> OverdueRow(r) }
        }
    }
}

@Composable
private fun OverdueRow(r: OverdueConsignment) {
    Row(
        Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        TitleWithCaption(r.partnerShopName, r.imei, Modifier.weight(1f), mono = true)
        Spacer(Modifier.width(Tokens.Space.gap))
        MoneyText(r.agreedPrice, style = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text))
        Spacer(Modifier.width(Tokens.Space.gap))
        StatusChip(dayOf(r.dueDate), color = Tokens.danger)
    }
}

/**
 * Model pricing & margins (`/reports/model-pricing`). Rendered as a vertical row
 * list (mirrors iOS) so it fits the card width with no horizontal scroll or
 * clipped header. Acquisition cost needs `device.cost.view`.
 */
@Composable
fun ModelPricingCard(vm: FinanceReadsViewModel, labels: Map<String, String>) {
    val t = LocalT.current
    val canCost = LocalCan.current("device.cost.view")
    SectionCard(t("dashboard.modelPricingTitle", null)) {
        val handle = rememberAsync { vm.modelPricing() }
        AsyncContent(handle, retryLabel = t("common.retry", null)) { rows ->
            if (rows.isEmpty()) EmptyView(t("common.notFound", null), compact = true)
            else RowList(rows) { r -> PricingRow(r, labels[r.modelId] ?: r.modelId, canCost) }
        }
    }
}

@Composable
private fun PricingRow(r: ModelPricingRow, name: String, canCost: Boolean) {
    val t = LocalT.current
    Column(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.rowV)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                name,
                style = MaterialTheme.typography.bodyMedium,
                color = Tokens.text,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )
            r.storage?.takeIf { it.isNotEmpty() }?.let { s ->
                Spacer(Modifier.width(Tokens.Space.gap))
                Text(s, style = MaterialTheme.typography.bodySmall, color = Tokens.muted, maxLines = 1)
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            Text(
                "${r.unitsInStock} / ${r.unitsSold}",
                style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                color = Tokens.muted,
                maxLines = 1,
            )
        }
        Spacer(Modifier.height(Tokens.Space.xs))
        if (canCost) PricingFigure(t("dashboard.avgAcquisitionCost", null), r.avgAcquisitionCost)
        PricingFigure(t("dashboard.avgSellingPrice", null), r.avgSellingPrice)
    }
}

/** One keyed figure per line (label left, mono value right) so a long Uzbek
 *  label never forces the amount to wrap mid-number. */
@Composable
private fun PricingFigure(label: String, value: String?) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.muted, modifier = Modifier.weight(1f))
        Spacer(Modifier.width(Tokens.Space.gap))
        if (value == null) {
            Text("—", style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        } else {
            MoneyText(value, style = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text))
        }
    }
}

/** Primary line in body, optional caption below (mono for an IMEI). */
@Composable
private fun TitleWithCaption(title: String, caption: String?, modifier: Modifier, mono: Boolean = false) {
    Column(modifier) {
        Text(
            title,
            style = MaterialTheme.typography.bodyMedium,
            color = Tokens.text,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        caption?.takeIf { it.isNotEmpty() }?.let { c ->
            val base = MaterialTheme.typography.bodySmall
            Text(c, style = if (mono) base.copy(fontFamily = MonoFamily) else base, color = Tokens.muted, maxLines = 1)
        }
    }
}

/** Rows split by hairline dividers inside a section card. */
@Composable
private fun <T> RowList(rows: List<T>, row: @Composable (T) -> Unit) {
    Column(Modifier.fillMaxWidth()) {
        rows.forEachIndexed { i, r ->
            row(r)
            if (i < rows.lastIndex) HorizontalDivider(color = Tokens.border)
        }
    }
}

/** Section card: Heading (titleMedium 17/600) over the content, same as iOS `DashSection`. */
@Composable
private fun SectionCard(title: String, content: @Composable () -> Unit) {
    AppCard(Modifier.fillMaxWidth()) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.md))
        content()
    }
}
