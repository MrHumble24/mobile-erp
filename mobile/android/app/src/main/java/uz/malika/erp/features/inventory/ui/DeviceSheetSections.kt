package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.data.DeviceHistoryEntry
import uz.malika.erp.features.inventory.data.DeviceStatusMeta
import uz.malika.erp.features.inventory.data.QcSummary
import uz.malika.erp.features.inventory.data.inventoryMargin
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private val BlockShape = RoundedCornerShape(Tokens.Radius.controls)

/** A deterministic faux-barcode drawn from the IMEI (mirrors the web client). */
@Composable
fun DeviceBarcode(imei: String) {
    if (imei.isEmpty()) return
    val bars = (0 until 44).map { i -> ((i * 7 + imei[i % imei.length].code) % 3) + 1 }
    // Intentional fixed white plate + black bars in both themes: cashiers scan
    // this, so it must stay high-contrast and scannable, not invert in dark mode.
    Column(
        Modifier
            .fillMaxWidth()
            .background(Color.White, BlockShape)
            .padding(vertical = Tokens.Space.md, horizontal = Tokens.Space.md),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(Modifier.height(36.dp), horizontalArrangement = Arrangement.Center) {
            bars.forEach { w ->
                Box(Modifier.width((w * 1.5).dp).height(36.dp).background(Color.Black))
                Spacer(Modifier.width(2.dp))
            }
        }
        Spacer(Modifier.height(Tokens.Space.xs))
        Text(imei, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Color.Black)
    }
}

/** A surface-2 block of keyed rows (label muted left, value right, hairlines), no border. */
@Composable
private fun FactBlock(content: @Composable () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .background(Tokens.surface2, BlockShape)
            .padding(horizontal = Tokens.Space.lg),
    ) { content() }
}

@Composable
private fun Fact(label: String, last: Boolean = false, value: @Composable () -> Unit) {
    Row(
        Modifier.fillMaxWidth().heightIn(min = 44.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        Spacer(Modifier.weight(1f))
        value()
    }
    if (!last) HorizontalDivider(color = Tokens.border)
}

@Composable
private fun valueStyle() = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text)

/** Specs block plus the margin row (shown only when landed cost is present). */
@Composable
fun DeviceSpecsGrid(device: DeviceDetail) {
    val t = LocalT.current
    fun spec(key: String) = device.specs[key]?.takeIf { it.isNotBlank() } ?: "—"
    Column(Modifier.fillMaxWidth()) {
        FactBlock {
            Fact(t("inventory.storage", null)) { Text(spec("storage"), style = valueStyle()) }
            Fact(t("inventory.color", null)) { Text(spec("color"), style = valueStyle()) }
            Fact(t("inventory.condition", null)) { Text(spec("condition"), style = valueStyle()) }
            Fact(t("inventory.ram", null)) { Text(spec("ram"), style = valueStyle()) }
            Fact(t("inventory.targetPrice", null)) { MoneyText(device.targetPrice, style = valueStyle()) }
            Fact(t("inventory.intakeDate", null), last = true) {
                Text(formatDate(device.intakeDate), style = valueStyle().copy(fontFamily = MonoFamily))
            }
        }
        // A unit bought from a customer has no shipment (ADR 0039).
        if (device.shipmentId == null) {
            Spacer(Modifier.height(Tokens.Space.sm))
            Text(t("purchases.boughtFromCustomer", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        }
        if (device.landedCost != null) {
            Spacer(Modifier.height(Tokens.Space.sm))
            CostBreakdown(device)
            Spacer(Modifier.height(Tokens.Space.sm))
            MarginRow(targetPrice = device.targetPrice, landedCost = device.landedCost)
        }
    }
}

/**
 * Per-phone cost parts (ADR 0026/0027): phone expense (+ its note), customs fee.
 * Only reached when landed cost is present, i.e. the caller may see costs; each
 * row renders only when the server sent that value.
 */
@Composable
private fun CostBreakdown(device: DeviceDetail) {
    val t = LocalT.current
    val rows = buildList<@Composable (Boolean) -> Unit> {
        device.unitExpense?.let { v ->
            add { last -> Fact(t("inventory.unitExpense", null), last) { MoneyText(v, style = valueStyle()) } }
        }
        device.unitExpenseNote?.takeIf { it.isNotBlank() }?.let { n ->
            add { last -> Fact(t("inventory.unitExpenseNote", null), last) { Text(n, style = valueStyle()) } }
        }
        device.customsFee?.let { v ->
            add { last -> Fact(t("inventory.customsFee", null), last) { MoneyText(v, style = valueStyle()) } }
        }
    }
    if (rows.isEmpty()) return
    FactBlock { rows.forEachIndexed { i, row -> row(i == rows.lastIndex) } }
}

@Composable
private fun MarginRow(targetPrice: String?, landedCost: String) {
    val t = LocalT.current
    val margin = inventoryMargin(targetPrice, landedCost)
    val color = if (margin.positive) Tokens.success else Tokens.danger
    val sign = if (margin.positive) "+" else ""
    FactBlock {
        Fact(t("inventory.landedCost", null)) { MoneyText(landedCost, style = valueStyle()) }
        Fact(t("inventory.margin", null), last = true) {
            Text(
                "$sign${formatMoney(margin.amount.toPlainString())} (${margin.percent.setScale(1, java.math.RoundingMode.HALF_UP)}%)",
                style = valueStyle().copy(fontFamily = MonoFamily, color = color),
            )
        }
    }
}

/** Latest QC inspection summary, or a placeholder when none exists. */
@Composable
fun QcSummarySection(qc: QcSummary?) {
    val t = LocalT.current
    if (qc == null) {
        Text(t("inventory.noQc", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
        return
    }
    FactBlock {
        Fact(t("qc.result", null), last = qc.gradeCode == null && qc.batteryHealth == null) {
            Text(
                if (qc.passed) t("qc.passed", null) else t("qc.failed", null),
                style = MaterialTheme.typography.titleSmall,
                color = if (qc.passed) Tokens.success else Tokens.danger,
            )
        }
        qc.gradeCode?.let { Fact(t("qc.grade", null), last = qc.batteryHealth == null) { Text(it, style = valueStyle()) } }
        qc.batteryHealth?.let {
            Fact(t("qc.batteryHealth", null), last = true) { Text("$it%", style = valueStyle().copy(fontFamily = MonoFamily)) }
        }
    }
}

/** Status-history list: translated transition, reason, mono timestamp. */
@Composable
fun DeviceHistoryList(history: List<DeviceHistoryEntry>) {
    val t = LocalT.current
    if (history.isEmpty()) {
        Text("—", style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
        return
    }
    fun label(code: String) = t(DeviceStatusMeta.labelKey(code), null)
    Column {
        history.forEachIndexed { i, h ->
            Column(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.sm)) {
                val from = h.fromStatusCode?.let { "${label(it)} → " } ?: ""
                Text(from + label(h.toStatusCode), style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                h.reason?.takeIf { it.isNotBlank() }?.let {
                    Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
                }
                Text(
                    formatDateTime(h.changedAt),
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                    color = Tokens.muted,
                )
            }
            if (i < history.lastIndex) HorizontalDivider(color = Tokens.border)
        }
    }
}
