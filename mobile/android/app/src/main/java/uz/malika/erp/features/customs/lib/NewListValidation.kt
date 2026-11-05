package uz.malika.erp.features.customs.lib

import uz.malika.erp.features.customs.data.PriceListItemBody

/** One editable row in the new-price-list sheet (strings straight from the fields). */
data class NewListRow(val code: String = "", val description: String = "", val fee: String = "")

/**
 * Validate the sheet's rows before POSTing (ADR 0027): a non-empty list with no
 * duplicate customs codes. Blank-code rows are ignored (they are placeholders).
 * Returns the i18n error key to show, or null when the rows are valid. Pure.
 */
fun newListError(rows: List<NewListRow>): String? {
    val codes = rows.map { it.code.trim() }.filter { it.isNotEmpty() }
    if (codes.isEmpty()) return "customs.errorNoRows"
    if (codes.size != codes.toHashSet().size) return "customs.errorDuplicateCode"
    return null
}

/** Build the request items from the sheet rows, dropping blank-code placeholders. */
fun newListItems(rows: List<NewListRow>): List<PriceListItemBody> =
    rows.filter { it.code.trim().isNotEmpty() }.map {
        PriceListItemBody(
            customsCode = it.code.trim(),
            description = it.description.trim().ifBlank { null },
            fee = it.fee.trim().toDoubleOrNull() ?: 0.0,
        )
    }
