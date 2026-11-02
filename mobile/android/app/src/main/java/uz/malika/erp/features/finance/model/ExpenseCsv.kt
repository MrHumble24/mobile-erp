package uz.malika.erp.features.finance.model

import uz.malika.erp.features.finance.data.Expense
import uz.malika.erp.shared.lib.Csv

/**
 * Builds the CSV for the currently loaded expenses (mirrors the web export:
 * fixed English column headers, `Yes/No` recurring, money as the raw decimal).
 * Pure — the screen hands the string to `shareTextFile`. Unit tested.
 */
fun buildExpensesCsv(expenses: List<Expense>): String {
    val headers = listOf("Date", "Category", "Description", "Vendor", "Amount", "Recurring", "Recorded By")
    val rows = expenses.map { e ->
        listOf(
            e.incurredAt?.take(10) ?: "",
            e.categoryName,
            e.description ?: "",
            e.vendor ?: "",
            e.amount,
            if (e.isRecurring) "Yes" else "No",
            e.createdBy?.displayName ?: "",
        )
    }
    return Csv.build(headers, rows)
}
