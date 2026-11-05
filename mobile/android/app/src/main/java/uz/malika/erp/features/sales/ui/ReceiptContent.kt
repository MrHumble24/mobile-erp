package uz.malika.erp.features.sales.ui

import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.lib.PrintRow
import uz.malika.erp.features.sales.lib.printReceipt
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.payments.ui.accountLabel
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

private val mono = TextStyle(fontFamily = MonoFamily, fontSize = 13.sp)

/** The on-screen 58mm receipt paper, shared by the POS and sales receipts. */
@Composable
fun ReceiptPaper(data: ReceiptData, t: Translate) {
    AppCard(Modifier.fillMaxWidth()) {
        Text(t("pos.storeName", null), style = mono.copy(fontWeight = FontWeight.Bold, textAlign = TextAlign.Center), modifier = Modifier.fillMaxWidth())
        Text(t("pos.storeLocation", null), style = mono.copy(textAlign = TextAlign.Center), modifier = Modifier.fillMaxWidth())
        Rule()
        KvRow(t("pos.receiptNumber", null), data.receiptId)
        data.soldAt?.let { KvRow(t("pos.soldAt", null), it) }
        KvRow(t("pos.cashier", null), data.cashier)
        data.customerName?.let { KvRow(t("sales.customer", null), it) }
        Rule()
        data.items.forEach { item ->
            Text(item.model, style = mono)
            // Quantity line (ADR 0030): "× n" instead of a unit code.
            item.quantity?.let { Text("× $it", style = mono.copy(fontSize = 11.sp)) }
                ?: item.code.takeIf { it.isNotBlank() }?.let { Text(it, style = mono.copy(fontSize = 11.sp)) }
            item.sub?.let { Text(it, style = mono.copy(fontSize = 11.sp)) }
            Text(formatMoney(item.price), style = mono, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.End)
            Spacer(Modifier.height(4.dp))
        }
        Rule()
        KvRow(t("pos.totalDue", null), formatMoney(data.total), bold = true)
        if (data.payments.isNotEmpty()) {
            KvRow(t("balance.paidWith", null), "")
            data.payments.forEach { p ->
                KvRow(accountLabel(p.accountCode, emptyList(), t), formatMoney(p.amount.toPlainString()))
            }
        }
        data.warrantyUntil?.let { KvRow(t("pos.warrantyUntil", null), it) }
        Spacer(Modifier.height(8.dp))
        Text(t("pos.thankYou", null), style = mono.copy(textAlign = TextAlign.Center), modifier = Modifier.fillMaxWidth())
        Text(t("pos.warrantyNotice", null), style = mono.copy(fontSize = 11.sp, textAlign = TextAlign.Center), modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun KvRow(label: String, value: String, bold: Boolean = false) {
    Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = mono)
        Text(value, style = if (bold) mono.copy(fontWeight = FontWeight.Bold) else mono, textAlign = TextAlign.End)
    }
}

@Composable
private fun Rule() {
    HorizontalDivider(Modifier.padding(vertical = 4.dp), color = Tokens.border)
}

/** The receipt as plain text, for the "copy to Telegram" action. */
fun buildReceiptText(t: Translate, data: ReceiptData): String = buildList {
    add(t("pos.storeName", null))
    add("${t("pos.receiptNumber", null)}: ${data.receiptId}")
    data.items.forEach {
        val tag = it.quantity?.let { q -> "× $q" } ?: it.code
        add("${it.model} ($tag)  ${formatMoney(it.price)}")
    }
    add("${t("pos.totalDue", null)}: ${formatMoney(data.total)}")
    data.warrantyUntil?.let { add("${t("pos.warrantyUntil", null)}: $it") }
    add(t("pos.thankYou", null))
}.joinToString("\n")

/** Send the receipt to the Android print framework (58mm). */
fun printReceiptData(context: Context, t: Translate, data: ReceiptData) {
    printReceipt(
        context = context,
        jobName = "${t("pos.receiptTitle", null)} ${data.receiptId}",
        title = t("pos.storeName", null),
        header = buildList {
            add(t("pos.storeLocation", null))
            add("${t("pos.receiptNumber", null)}: ${data.receiptId}")
            data.soldAt?.let { add("${t("pos.soldAt", null)}: $it") }
            add("${t("pos.cashier", null)}: ${data.cashier}")
        },
        rows = buildList {
            data.customerName?.let { add(PrintRow("${t("sales.customer", null)}:", it)) }
            data.items.forEach {
                add(PrintRow(it.model))
                add(PrintRow(it.quantity?.let { q -> "× $q" } ?: it.code, formatMoney(it.price)))
            }
            add(PrintRow("${t("pos.totalDue", null)}:", formatMoney(data.total), bold = true))
            data.warrantyUntil?.let { add(PrintRow("${t("pos.warrantyUntil", null)}:", it)) }
        },
        footer = listOf(t("pos.thankYou", null), t("pos.warrantyNotice", null)),
    )
}
