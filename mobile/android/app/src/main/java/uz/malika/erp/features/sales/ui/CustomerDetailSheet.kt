package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.features.sales.data.CustomerListItem
import uz.malika.erp.features.sales.data.CustomerSale
import uz.malika.erp.features.sales.model.CustomersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatDate
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.FactRow
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Customer detail sheet: name + mono phone + notes, keyed facts (purchases,
 * total spent, warranties, returns), the purchase history as hairline rows,
 * and edit as a secondary pill for `customer.manage`.
 */
@Composable
fun CustomerDetailSheet(customer: CustomerListItem, vm: CustomersViewModel, canManage: Boolean, onEdit: () -> Unit) {
    val t = LocalT.current
    val sales by vm.sales.collectAsState()
    LaunchedEffect(customer.id) { vm.loadSales(customer.id) }
    val mono = MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily, color = Tokens.text)

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(Tokens.Space.gutter)) {
        Text(customer.name, style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        customer.phone?.let { Text(it, style = mono) }
        customer.notes?.takeIf { it.isNotBlank() }?.let {
            Spacer(Modifier.height(Tokens.Space.xs))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.muted)
        }
        Spacer(Modifier.height(Tokens.Space.lg))

        FactRow(t("customers.statPurchases", null)) { Text(customer.purchaseCount.toString(), style = mono) }
        FactRow(t("customers.statTotalSpent", null)) { Text(formatMoney(customer.totalSpent.toString()), style = mono) }
        FactRow(t("customers.statActiveWarranties", null)) { Text(customer.activeWarranties.toString(), style = mono) }
        FactRow(t("customers.statReturns", null), last = true) { Text(customer.returnsCount.toString(), style = mono) }

        Spacer(Modifier.height(Tokens.Space.lg))
        Text(t("customers.purchaseHistory", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
        Spacer(Modifier.height(Tokens.Space.sm))
        when {
            sales.loading -> Loading()
            sales.items.isEmpty() -> Text(t("customers.noPurchases", null), style = MaterialTheme.typography.bodyMedium, color = Tokens.muted)
            else -> sales.items.forEachIndexed { i, s ->
                SaleHistoryRow(s)
                if (i < sales.items.lastIndex) HorizontalDivider(color = Tokens.border)
            }
        }

        if (canManage) {
            Spacer(Modifier.height(Tokens.Space.lg))
            PillButton(t("customers.edit", null), onEdit, variant = ButtonVariant.SECONDARY, modifier = Modifier.fillMaxWidth())
        }
        Spacer(Modifier.height(Tokens.Space.sm))
    }
}

@Composable
private fun SaleHistoryRow(sale: CustomerSale) {
    Row(Modifier.fillMaxWidth().padding(vertical = Tokens.Space.sm), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(sale.modelLabel, style = MaterialTheme.typography.bodyMedium, color = Tokens.text)
            Text(sale.code, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily), color = Tokens.text)
            sale.soldAt?.let { Text(formatDate(it), style = MaterialTheme.typography.bodySmall, color = Tokens.muted) }
        }
        MoneyText(sale.salePrice, style = MaterialTheme.typography.titleSmall.copy(color = Tokens.text))
    }
}
