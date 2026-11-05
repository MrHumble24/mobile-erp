package uz.malika.erp.features.sales.lib

import uz.malika.erp.features.sales.data.Sale
import uz.malika.erp.features.sales.data.SaleChannel
import uz.malika.erp.shared.lib.Csv

/**
 * Build a CSV of the currently loaded sales (mirrors the web `exportSalesCsv`).
 * The Net Profit column is included only when [includeProfit] (the caller may
 * see it and at least one row carries it). Values are passed pre-stringified.
 */
fun salesCsv(sales: List<Sale>, includeProfit: Boolean): String {
    val headers = buildList {
        add("Model"); add("Code"); add("Qty"); add("Channel"); add("Customer"); add("Sale Price")
        if (includeProfit) add("Net Profit")
        add("Cashier"); add("Sold At"); add("Status")
    }
    val rows = sales.map { s ->
        buildList {
            add(s.modelLabel)
            add(s.code) // empty for a quantity sale
            add(s.quantity?.toString() ?: "") // pieces for a quantity sale (ADR 0030)
            add(if (s.channel == SaleChannel.B2B) "B2B" else "Retail")
            add(s.customerName ?: "")
            add(s.salePrice)
            if (includeProfit) add(s.netProfit ?: "")
            add(s.soldByName)
            add(s.soldAt ?: "")
            add(if (s.returnedAt != null) "Returned" else "Sold")
        }
    }
    return Csv.build(headers, rows)
}
