package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.sales.data.CustomerListItem
import uz.malika.erp.features.sales.data.CustomerSale
import uz.malika.erp.features.sales.lib.formatDate
import uz.malika.erp.features.sales.model.CustomersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.MoneyText
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Customer detail: contact, aggregates, purchase history, and an edit action. */
@Composable
fun CustomerDetailSheet(customer: CustomerListItem, vm: CustomersViewModel, canManage: Boolean, onEdit: () -> Unit) {
    val t = LocalT.current
    val sales by vm.sales.collectAsState()

    LaunchedEffect(customer.id) { vm.loadSales(customer.id) }

    Column(Modifier.fillMaxWidth().padding(20.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(customer.name, style = MaterialTheme.typography.titleLarge)
                customer.phone?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
            }
            if (canManage) PillButton(t("common.edit", null), onEdit, variant = ButtonVariant.OUTLINE)
        }
        customer.notes?.let {
            Spacer(Modifier.height(6.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Stat(t("pos.purchaseCount", mapOf("count" to customer.purchaseCount)), formatMoney(customer.totalSpent.toString()))
            Stat(t("sales.warranty", null), customer.activeWarranties.toString())
            Stat(t("sales.returned", null), customer.returnsCount.toString())
        }
        Spacer(Modifier.height(16.dp))
        Text(t("sales.customerSalesHistory", null), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Box(Modifier.fillMaxWidth().heightIn(max = 320.dp)) {
            when {
                sales.loading -> Loading()
                sales.items.isEmpty() -> EmptyView(t("sales.noSalesFound", null))
                else -> LazyColumn(Modifier.fillMaxWidth()) {
                    items(sales.items) { s -> SaleHistoryRow(s) }
                }
            }
        }
    }
}

@Composable
private fun Stat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleSmall)
        Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
    }
}

@Composable
private fun SaleHistoryRow(sale: CustomerSale) {
    Column(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(sale.modelLabel, style = MaterialTheme.typography.bodyMedium)
                Text(sale.imei, style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily))
                Text(formatDate(sale.soldAt), style = MaterialTheme.typography.bodySmall)
            }
            MoneyText(sale.salePrice, style = MaterialTheme.typography.titleSmall)
        }
        HorizontalDivider(color = Tokens.border)
    }
}
