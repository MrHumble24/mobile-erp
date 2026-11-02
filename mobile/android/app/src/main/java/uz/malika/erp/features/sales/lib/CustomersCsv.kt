package uz.malika.erp.features.sales.lib

import uz.malika.erp.features.sales.data.CustomerListItem
import uz.malika.erp.shared.lib.Csv

/** Build a CSV of the loaded customer directory (mirrors the web `exportCustomersCsv`). */
fun customersCsv(customers: List<CustomerListItem>): String {
    val headers = listOf("Name", "Phone", "Purchases", "Total Spent", "Active Warranties", "Returns")
    val rows = customers.map {
        listOf(
            it.name,
            it.phone ?: "",
            it.purchaseCount.toString(),
            it.totalSpent.toString(),
            it.activeWarranties.toString(),
            it.returnsCount.toString(),
        )
    }
    return Csv.build(headers, rows)
}
