package uz.malika.erp.features.sales.model

/**
 * The trade-ins held in the till's cart (ADR 0039), split out of [PosViewModel]
 * to keep it under the file-size limit. The checkout of a cart with trade-ins or
 * points is `checkoutDirect` in PosBonus.kt.
 */

/** Add / remove a traded-in phone held in the cart. */
fun PosViewModel.addTradeIn(draft: TradeInDraft) {
    _state.value = _state.value.copy(tradeIns = _state.value.tradeIns + draft)
}

fun PosViewModel.removeTradeIn(id: String) {
    _state.value = _state.value.copy(tradeIns = _state.value.tradeIns.filterNot { it.id == id })
}
