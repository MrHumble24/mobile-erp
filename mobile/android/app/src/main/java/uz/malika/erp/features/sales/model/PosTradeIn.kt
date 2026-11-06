package uz.malika.erp.features.sales.model

import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import uz.malika.erp.features.sales.lib.PricedCart
import uz.malika.erp.shared.payments.AccountAmount

/**
 * The till's trade-in checkout (ADR 0039), split out of [PosViewModel] to keep it
 * under the file-size limit. A cart that carries trade-ins is online only and is
 * posted one direct `POST /sales` per line (never queued, because the server
 * refuses trade-ins on the sync replay). Committed lines + their trade-ins are
 * dropped so a retry after a partial failure never re-sends a trade-in.
 */

/** Add / remove a traded-in phone held in the cart. */
fun PosViewModel.addTradeIn(draft: TradeInDraft) {
    _state.value = _state.value.copy(tradeIns = _state.value.tradeIns + draft)
}

fun PosViewModel.removeTradeIn(id: String) {
    _state.value = _state.value.copy(tradeIns = _state.value.tradeIns.filterNot { it.id == id })
}

/** Checkout a cart with trade-ins; a customer is required and it must be online. */
fun PosViewModel.checkoutWithTradeIns(
    online: Boolean,
    customerId: String?,
    customerName: String?,
    customerPhone: String?,
    notes: String?,
    parts: List<AccountAmount>,
) {
    val s = _state.value
    val priced = s.priced
    val hasCustomer = !customerId.isNullOrBlank() || !customerName.isNullOrBlank()
    if (!online || priced.lines.isEmpty() || s.tradeIns.isEmpty() || !hasCustomer) return
    priced.rejection?.let { _state.value = s.copy(errorKey = it.key); return }
    if (!s.tradeInPlan.ok) { _state.value = s.copy(errorKey = "purchases.tradeInExceedsLine"); return }
    _state.value = s.copy(busy = true, errorKey = null)
    viewModelScope.launch {
        val result = TradeInCheckout.run(
            priced.lines, s.level, customerId, customerName, customerPhone, notes, s.tradeIns, parts,
        ) { repo.createSaleDirect(it) }
        finishTradeIn(s, priced, result, online, customerName, parts)
    }
}

private fun PosViewModel.finishTradeIn(
    before: PosState,
    priced: PricedCart,
    result: TradeInCheckoutResult,
    online: Boolean,
    customerName: String?,
    parts: List<AccountAmount>,
) {
    val s = _state.value
    if (result.error != null) {
        _state.value = s.copy(
            busy = false,
            errorKey = result.error,
            lines = s.lines.filterNot { it.key in result.committedLineKeys },
            tradeIns = s.tradeIns.filterNot { it.id in result.committedTradeInIds },
        )
        return
    }
    _state.value = s.cleared(completed = buildTradeInReceipt(
        result.saleIds.first(), cashierName, before.level, priced, online, customerName, parts, before.tradeIns,
    ))
}
