package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.sales.data.Sale
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One sale card: model, mono IMEI(s), customer · day left; mono price and the
 *  channel / returned pills right — the same anatomy as the iOS `SaleRow`. */
@Composable
internal fun SaleRow(sale: Sale, t: uz.malika.erp.i18n.Translate, onClick: () -> Unit) {
    val retail = sale.channel == SaleChannel.RETAIL
    AppCard(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.gap), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
            Column(Modifier.weight(1f)) {
                Text(sale.modelLabel, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
                if (sale.isQuantity) {
                    // Quantity sale (ADR 0030): piece count, no unit code.
                    Text("× ${sale.quantity}", style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
                } else {
                    Text(sale.code, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.text)
                    sale.imei2?.takeIf { it.isNotBlank() }?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily), color = Tokens.muted)
                    }
                }
                Text(
                    "${sale.customerName ?: t("pos.walkIn", null)} · ${formatDate(sale.soldAt)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Tokens.muted,
                )
            }
            Spacer(Modifier.width(Tokens.Space.gap))
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(Tokens.Space.xs)) {
                MoneyText(sale.salePrice, style = MaterialTheme.typography.titleSmall.copy(color = Tokens.text))
                StatusChip(
                    if (retail) t("sales.channelRetail", null) else t("sales.channelB2B", null),
                    color = if (retail) Tokens.info else Tokens.warning,
                )
                if (sale.returnedAt != null) StatusChip(t("sales.returned", null), color = Tokens.danger)
            }
        }
    }
}
