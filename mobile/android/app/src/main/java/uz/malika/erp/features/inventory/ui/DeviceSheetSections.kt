package uz.malika.erp.features.inventory.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.inventory.data.DeviceDetail
import uz.malika.erp.features.inventory.data.DeviceHistoryEntry
import uz.malika.erp.features.inventory.data.QcSummary
import uz.malika.erp.features.inventory.data.inventoryMargin
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** A deterministic faux-barcode drawn from the IMEI (mirrors the web client). */
@Composable
fun DeviceBarcode(imei: String) {
    if (imei.isEmpty()) return
    val bars = (0 until 44).map { i -> ((i * 7 + imei[i % imei.length].code) % 3) + 1 }
    Column(
        Modifier
            .fillMaxWidth()
            .background(Tokens.signalWhite, RoundedCornerShape(12.dp))
            .border(BorderStroke(1.dp, Tokens.bone), RoundedCornerShape(12.dp))
            .padding(vertical = 8.dp, horizontal = 12.dp),
        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
    ) {
        Row(Modifier.height(36.dp), horizontalArrangement = Arrangement.Center) {
            bars.forEach { w ->
                Box(Modifier.width((w * 1.5).dp).height(36.dp).background(Tokens.inkBlack))
                Spacer(Modifier.width(2.dp))
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(imei, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily))
    }
}

/** Specs grid plus the margin row (shown only when landed cost is present). */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun DeviceSpecsGrid(device: DeviceDetail) {
    val t = LocalT.current
    fun spec(key: String) = device.specs[key] ?: "—"
    Column(Modifier.fillMaxWidth()) {
        FlowRow(
            Modifier
                .fillMaxWidth()
                .background(Tokens.mist, RoundedCornerShape(12.dp))
                .border(BorderStroke(1.dp, Tokens.bone), RoundedCornerShape(12.dp))
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            SpecCell(t("inventory.storage", null), spec("storage"))
            SpecCell(t("inventory.color", null), spec("color"))
            SpecCell(t("inventory.condition", null), spec("condition"))
            SpecCell(t("inventory.ram", null), spec("ram"))
            SpecCell(t("inventory.targetPrice", null), formatMoney(device.targetPrice))
        }
        if (device.landedCost != null) {
            Spacer(Modifier.height(8.dp))
            MarginRow(targetPrice = device.targetPrice, landedCost = device.landedCost)
        }
    }
}

@Composable
private fun SpecCell(label: String, value: String) {
    Column {
        Text(label, style = MaterialTheme.typography.labelMedium, color = Tokens.slate)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun MarginRow(targetPrice: String?, landedCost: String) {
    val t = LocalT.current
    val margin = inventoryMargin(targetPrice, landedCost)
    val color = if (margin.positive) Tokens.success else Tokens.danger
    Row(
        Modifier
            .fillMaxWidth()
            .background(Tokens.signalWhite, RoundedCornerShape(12.dp))
            .border(BorderStroke(1.dp, Tokens.bone), RoundedCornerShape(12.dp))
            .padding(12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Row {
            Text("${t("inventory.landedCost", null)}: ", style = MaterialTheme.typography.bodySmall)
            MoneyText(landedCost, style = MaterialTheme.typography.bodySmall)
        }
        val sign = if (margin.positive) "+" else ""
        Text(
            "${t("inventory.margin", null)}: $sign${formatMoney(margin.amount.toPlainString())} " +
                "(${margin.percent.setScale(1, java.math.RoundingMode.HALF_UP)}%)",
            style = MaterialTheme.typography.bodySmall,
            color = color,
            fontWeight = FontWeight.Bold,
        )
    }
}

/** Latest QC inspection summary, or a placeholder when none exists. */
@Composable
fun QcSummarySection(qc: QcSummary?) {
    val t = LocalT.current
    if (qc == null) {
        Text(t("inventory.noQc", null), style = MaterialTheme.typography.bodyMedium)
        return
    }
    Column(
        Modifier
            .fillMaxWidth()
            .background(Tokens.mist, RoundedCornerShape(12.dp))
            .border(BorderStroke(1.dp, Tokens.bone), RoundedCornerShape(12.dp))
            .padding(16.dp),
    ) {
        Kv(
            t("qc.result", null),
            if (qc.passed) t("qc.passed", null) else t("qc.failed", null),
            if (qc.passed) Tokens.success else Tokens.danger,
        )
        qc.gradeCode?.let { Kv(t("qc.grade", null), it, null) }
        qc.batteryHealth?.let { Kv(t("qc.batteryHealth", null), "$it%", null) }
    }
}

@Composable
private fun Kv(key: String, value: String, color: Color?) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(key, style = MaterialTheme.typography.bodySmall)
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            color = color ?: Tokens.foreground,
            fontWeight = FontWeight.W600,
        )
    }
}

/** Scrollable status-history list. */
@Composable
fun DeviceHistoryList(history: List<DeviceHistoryEntry>) {
    if (history.isEmpty()) {
        Text("—", style = MaterialTheme.typography.bodyMedium)
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        history.forEach { h ->
            Column {
                val from = h.fromStatusCode?.let { "$it → " } ?: ""
                Text(from + h.toStatusCode, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.W600)
                h.reason?.let { Text("\"$it\"", style = MaterialTheme.typography.bodySmall) }
                Text(h.changedAt, style = MaterialTheme.typography.labelMedium, color = Tokens.slate)
            }
        }
    }
}
