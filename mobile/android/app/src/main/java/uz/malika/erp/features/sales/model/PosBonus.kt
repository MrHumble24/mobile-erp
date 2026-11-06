package uz.malika.erp.features.sales.model

import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import uz.malika.erp.features.sales.data.CustomerBonus
import uz.malika.erp.features.sales.lib.PricedCart
import uz.malika.erp.features.sales.lib.fromCents
import uz.malika.erp.features.sales.lib.toCents
import uz.malika.erp.shared.lib.parseMoney
import uz.malika.erp.shared.payments.AccountAmount
import java.math.BigDecimal

/**
 * The till's bonus-points checkout (ADR 0043), split out of [PosViewModel] to
 * keep it under the file-size limit. A cart that carries points is online only
 * and is posted one direct `POST /sales` per line (never queued, because the
 * server refuses bonus redemptions on the sync replay). Committed lines and
 * their points are dropped so a retry after a partial failure never spends
 * points twice.
 */

/**
 * Load the chosen customer's balance and max redeem share; clears them when there
 * is no customer, no connection, or bonus is off. A newer call cancels an older
 * one, so a slow answer for the previous customer can never land on this one.
 * Writes only the two bonus fields onto the CURRENT state (the cart may have
 * changed while the answer was on its way) and never blocks the till.
 */
fun PosViewModel.loadCustomerBonus(customerId: String?, online: Boolean) {
    bonusJob?.cancel()
    fun clear() { _state.value = _state.value.copy(customerBonus = null, bonusRequested = BigDecimal.ZERO) }
    if (customerId.isNullOrBlank() || !online || !_state.value.bonusEnabled) { clear(); return }
    if (_state.value.customerBonus?.customerId != customerId) clear()
    bonusJob = viewModelScope.launch {
        val dto = try { repo.customerBonus(customerId) } catch (e: kotlinx.coroutines.CancellationException) { throw e } catch (_: Exception) { null }
        if (dto == null || !dto.enabled) { clear(); return@launch }
        _state.value = _state.value.copy(
            customerBonus = CustomerBonus(customerId, parseMoney(dto.balance), parseMoney(dto.maxRedeemPercent)),
        )
    }
}

/** Store the amount the cashier wants to spend, clamped to the plan's max. */
fun PosViewModel.setBonusRequested(amount: BigDecimal) {
    val s = _state.value
    val max = s.bonusPlan.maxCents.fromCents()
    _state.value = s.copy(bonusRequested = amount.coerceIn(BigDecimal.ZERO, max))
}

/** Checkout a cart with trade-ins or points; a customer is required when points are used and it must be online. */
fun PosViewModel.checkoutDirect(
    online: Boolean,
    customerId: String?,
    customerName: String?,
    customerPhone: String?,
    notes: String?,
    parts: List<AccountAmount>,
) {
    val s = _state.value
    val priced = s.priced
    val bonusByLine = s.bonusPlan.byLine
    val hasPoints = bonusByLine.isNotEmpty()
    if (priced.lines.isEmpty()) return
    priced.rejection?.let { _state.value = s.copy(errorKey = it.key); return }
    if (!online || (s.tradeIns.isEmpty() && !hasPoints)) return
    // Points belong to the customer they were looked up for, and to nobody else.
    if (hasPoints && s.customerBonus?.customerId != customerId) { _state.value = s.copy(errorKey = "pos.bonusErrorNoCustomer"); return }
    if (!s.tradeInPlan.ok) { _state.value = s.copy(errorKey = "purchases.tradeInExceedsLine"); return }
    _state.value = s.copy(busy = true, errorKey = null)
    viewModelScope.launch {
        val result = TradeInCheckout.run(
            priced.lines, s.level, customerId, customerName, customerPhone, notes, s.tradeIns, parts, bonusByLine,
        ) { repo.createSaleDirect(it) }
        finishCheckoutDirect(s, priced, result, online, customerName, parts)
    }
}

private fun PosViewModel.finishCheckoutDirect(
    before: PosState,
    priced: PricedCart,
    result: TradeInCheckoutResult,
    online: Boolean,
    customerName: String?,
    parts: List<AccountAmount>,
) {
    val s = _state.value
    if (result.error != null) {
        val committedPoints = result.committedLineKeys.sumOf { before.bonusPlan.byLine[it] ?: 0L }
        val remaining = (before.bonusRequested.toCents() - committedPoints).coerceAtLeast(0)
        _state.value = s.copy(
            busy = false,
            errorKey = result.error,
            lines = s.lines.filterNot { it.key in result.committedLineKeys },
            tradeIns = s.tradeIns.filterNot { it.id in result.committedTradeInIds },
            bonusRequested = remaining.fromCents(),
            // The committed lines already spent these points on the server.
            customerBonus = s.customerBonus?.let { it.copy(balance = (it.balance - committedPoints.fromCents()).max(BigDecimal.ZERO)) },
        )
        return
    }
    val pointsSpent = before.bonusPlan.totalCents.fromCents().takeIf { it.signum() > 0 }?.toPlainString()
    _state.value = s.cleared(completed = buildTradeInReceipt(
        result.saleIds.first(), cashierName, before.level, priced, online, customerName, parts, before.tradeIns,
        storeName = before.storeName, storeAddress = before.storeAddress, storePhone = before.storePhone,
        footer = before.receiptFooter, pointsSpent = pointsSpent,
    ))
}
