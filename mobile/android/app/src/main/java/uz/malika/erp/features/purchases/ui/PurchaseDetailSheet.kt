package uz.malika.erp.features.purchases.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import uz.malika.erp.features.balance.model.ledgerAccountKey
import uz.malika.erp.features.purchases.data.CustomerPurchaseDto
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDateTime
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** One customer purchase in full (ADR 0039): seller, unit, price paid, account, who. */
@Composable
fun PurchaseDetailSheet(purchase: CustomerPurchaseDto) {
    val t = LocalT.current
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)

    Column(Modifier.fillMaxWidth().padding(Tokens.Space.gutter)) {
        Text(t("purchases.detailTitle", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.lg))

        AppCard(Modifier.fillMaxWidth()) {
            FactRow(t("purchases.seller", null)) { Text(purchase.customer.name, style = mono) }
            purchase.customer.phone?.takeIf { it.isNotBlank() }?.let { FactRow(t("purchases.sellerPhone", null)) { Text(it, style = mono) } }
            FactRow(t("purchases.unit", null)) { Text(purchase.unit.model.label, style = mono) }
            purchase.code.takeIf { it.isNotBlank() }?.let {
                FactRow(t("purchases.searchByCode", null), last = purchase.pricePaid == null) { Text(it, style = mono) }
            }
        }
        Spacer(Modifier.height(Tokens.Space.lg))

        Text(t("purchases.moneySection", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        AppCard(Modifier.fillMaxWidth()) {
            purchase.pricePaid?.let { FactRow(t("purchases.pricePaid", null)) { MoneyText(it, style = mono) } }
            FactRow(t("purchases.account", null)) {
                val label = purchase.accountCode?.let { code -> ledgerAccountKey(code)?.let { t(it, null) } ?: code }
                    ?: t("purchases.tradeInLabel", null)
                Text(label, style = mono)
            }
            FactRow(t("purchases.soldBy", null)) { Text(purchase.soldBy.name, style = mono) }
            FactRow(t("common.date", null), last = true) { Text(formatDateTime(purchase.occurredAt), style = mono) }
        }
        Spacer(Modifier.height(Tokens.Space.md))
    }
}
