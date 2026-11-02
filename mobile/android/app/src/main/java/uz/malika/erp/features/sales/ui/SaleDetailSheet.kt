package uz.malika.erp.features.sales.ui

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.Sale
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.lib.formatDate
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Detail view for one sale: facts, the printable receipt, and the return flow. */
@Composable
fun SaleDetailSheet(sale: Sale, canReturn: Boolean, onReceipt: () -> Unit, onReturn: () -> Unit) {
    val t = LocalT.current
    val retail = sale.channel == SaleChannel.RETAIL
    Column(Modifier.fillMaxWidth().padding(20.dp)) {
        Row(Modifier.fillMaxWidth()) {
            Text("${sale.modelLabel} · ${sale.imei}", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
            StatusChip(
                if (retail) t("sales.channelRetail", null) else t("sales.channelB2B", null),
                color = if (retail) Tokens.signalBlue else Tokens.warning,
            )
        }
        Spacer(Modifier.height(12.dp))
        Kv(t("sales.salePrice", null), formatMoney(sale.salePrice))
        sale.netProfit?.let { Kv(t("sales.netProfit", null), formatMoney(it)) }
        sale.customerName?.let { Kv(t("sales.customer", null), it) }
        Kv(t("sales.soldBy", null), sale.soldByName)
        sale.soldAt?.let { Kv(t("sales.soldAt", null), formatDate(it)) }
        sale.warrantyDays?.let { Kv(t("pos.warrantyDays", null), it.toString()) }
        sale.returnedAt?.let { Kv(t("sales.returnedAt", null), formatDate(it)) }
        Spacer(Modifier.height(20.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            PillButton(t("sales.receipt", null), onReceipt, Modifier.weight(1f), variant = ButtonVariant.OUTLINE)
            if (canReturn && sale.returnedAt == null) {
                PillButton(t("sales.returnDevice", null), onReturn, Modifier.weight(1f))
            }
        }
    }
}

/** The printable receipt (server copy) with copy + print actions. */
@Composable
fun ReceiptSheet(data: ReceiptData, onClose: () -> Unit) {
    val t = LocalT.current
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    Column(Modifier.fillMaxWidth().padding(20.dp)) {
        ReceiptPaper(data, t)
        Spacer(Modifier.height(16.dp))
        PillButton(
            text = t("pos.copyCheque", null),
            onClick = {
                clipboard.setText(AnnotatedString(buildReceiptText(t, data)))
                Toast.makeText(context, t("pos.chequeCopied", null), Toast.LENGTH_SHORT).show()
            },
            modifier = Modifier.fillMaxWidth(),
            variant = ButtonVariant.OUTLINE,
        )
        Spacer(Modifier.height(8.dp))
        PillButton(t("sales.printReceipt", null), { printReceiptData(context, t, data) }, Modifier.fillMaxWidth())
        Spacer(Modifier.height(8.dp))
        PillButton(t("common.close", null), onClose, Modifier.fillMaxWidth(), variant = ButtonVariant.GHOST)
    }
}

@Composable
private fun Kv(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Text(value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium))
    }
}
