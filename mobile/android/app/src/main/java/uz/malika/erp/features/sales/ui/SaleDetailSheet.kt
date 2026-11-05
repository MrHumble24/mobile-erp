package uz.malika.erp.features.sales.ui

import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.Sale
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.payments.ui.accountLabel
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.signTint
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Detail view for one sale as a Warm Card sheet: the device block (model,
 * IMEIs with copy, channel / returned pills), keyed facts, then the actions —
 * the same anatomy as the iOS `SaleDetailSheet`. Return is a destructive pill;
 * the one orange stays on the list's warranty action.
 */
@Composable
fun SaleDetailSheet(
    sale: Sale,
    canReturn: Boolean,
    onReceipt: () -> Unit,
    onReturn: () -> Unit,
    onOpenDevice: () -> Unit,
    onOpenConsignment: () -> Unit,
) {
    val t = LocalT.current
    val context = LocalContext.current
    val retail = sale.channel == SaleChannel.RETAIL
    // Facts + four actions can exceed a phone sheet: the sheet column scrolls.
    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(sale.modelLabel, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        if (sale.isQuantity) {
            // Quantity sale (ADR 0030): no device identifier — show the piece count.
            Text(
                "× ${sale.quantity}",
                style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily),
                color = Tokens.text,
            )
        } else {
            ImeiLine(if (sale.imei != null) "IMEI" else t("catalog.unitCode", null), sale.code)
            sale.imei2?.takeIf { it.isNotBlank() }?.let { ImeiLine(t("inventory.imei2", null), it) }
        }
        Spacer(Modifier.height(Tokens.Space.sm))
        Row(horizontalArrangement = Arrangement.spacedBy(Tokens.Space.sm)) {
            StatusChip(
                if (retail) t("sales.channelRetail", null) else t("sales.channelB2B", null),
                color = if (retail) Tokens.info else Tokens.warning,
            )
            if (sale.returnedAt != null) StatusChip(t("sales.returned", null), color = Tokens.danger)
        }
        Spacer(Modifier.height(Tokens.Space.lg))

        if (sale.showPricing) {
            sale.priceLevelCode?.let { lvl ->
                Fact(t("pricing.priceLevel", null)) { Text(t(PriceLevel.labelKey(lvl), null), style = valueStyle()) }
            }
            sale.listPrice?.let { lp ->
                Fact(t("pricing.listPrice", null)) { MoneyText(lp, style = monoStyle()) }
            }
            sale.discountAmount?.takeIf { parseMoney(it).signum() > 0 }?.let { d ->
                Fact(t("pricing.discount", null)) { MoneyText(d, style = monoStyle().copy(color = Tokens.success)) }
            }
        }
        Fact(t("sales.salePrice", null)) { MoneyText(sale.salePrice, style = valueStyle()) }
        sale.netProfit?.let { net ->
            Fact(t("sales.netProfit", null)) { MoneyText(net, style = valueStyle().copy(color = signTint(net))) }
        }
        sale.customerName?.let { Fact(t("sales.customer", null)) { Text(it, style = valueStyle()) } }
        sale.customerPhone?.takeIf { it.isNotBlank() }?.let { phone ->
            Fact(t("common.phone", null)) {
                Text(
                    phone,
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = Tokens.info,
                    modifier = Modifier.clickable {
                        context.startActivity(Intent(Intent.ACTION_DIAL, "tel:$phone".toUri()))
                    },
                )
            }
        }
        Fact(t("sales.soldBy", null)) { Text(sale.soldByName, style = valueStyle()) }
        sale.soldAt?.let { Fact(t("sales.soldAt", null)) { Text(formatDateTime(it), style = monoStyle()) } }
        sale.warrantyDays?.let { Fact(t("pos.warrantyDays", null)) { Text(it.toString(), style = monoStyle()) } }
        sale.returnedAt?.let { Fact(t("sales.returnedAt", null)) { Text(formatDateTime(it), style = monoStyle()) } }

        if (sale.payments.isNotEmpty()) {
            Spacer(Modifier.height(Tokens.Space.md))
            Text(t("balance.paidWith", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            sale.payments.forEach { p ->
                Fact(accountLabel(p.accountCode, emptyList(), t)) {
                    MoneyText(p.amount.toPlainString(), style = valueStyle().copy(fontFamily = MonoFamily))
                }
            }
        }

        Spacer(Modifier.height(Tokens.Space.lg))
        // A quantity sale has no device to open.
        if (!sale.isQuantity) {
            PillButton(t("sales.openDevice", null), onOpenDevice, Modifier.fillMaxWidth(), variant = ButtonVariant.GHOST)
        }
        if (sale.consignmentId != null) {
            Spacer(Modifier.height(Tokens.Space.sm))
            PillButton(t("sales.viewConsignment", null), onOpenConsignment, Modifier.fillMaxWidth(), variant = ButtonVariant.GHOST)
        }
        Spacer(Modifier.height(Tokens.Space.sm))
        PillButton(t("sales.receipt", null), onReceipt, Modifier.fillMaxWidth(), variant = ButtonVariant.SECONDARY)
        if (canReturn && sale.returnedAt == null) {
            Spacer(Modifier.height(Tokens.Space.sm))
            PillButton(t("sales.returnDevice", null), onReturn, Modifier.fillMaxWidth(), variant = ButtonVariant.DESTRUCTIVE)
        }
    }
}

/** `label: imei` in mono with a copy action (the iOS `CopyableIMEI`). */
@Composable
private fun ImeiLine(label: String, imei: String) {
    val t = LocalT.current
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text("$label: $imei", style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
        IconButton(onClick = {
            clipboard.setText(AnnotatedString(imei))
            Toast.makeText(context, "${t("inventory.imeiCopied", null)}: $imei", Toast.LENGTH_SHORT).show()
        }) {
            Icon(Icons.Outlined.ContentCopy, contentDescription = t("inventory.copyImei", null), tint = Tokens.muted, modifier = Modifier.size(18.dp))
        }
    }
}

/** Keyed fact row: muted label left, value right, hairline below. */
@Composable
private fun Fact(label: String, value: @Composable () -> Unit) {
    Column {
        Row(
            Modifier.fillMaxWidth().heightIn(min = Tokens.minTouch),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
            Spacer(Modifier.weight(1f))
            value()
        }
        HorizontalDivider(color = Tokens.border)
    }
}

@Composable
private fun valueStyle() = MaterialTheme.typography.bodyMedium.copy(color = Tokens.text)

@Composable
private fun monoStyle() = valueStyle().copy(fontFamily = MonoFamily)

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

