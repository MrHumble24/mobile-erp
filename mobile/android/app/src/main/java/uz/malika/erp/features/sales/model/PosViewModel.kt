package uz.malika.erp.features.sales.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.sales.data.CartLine
import uz.malika.erp.features.sales.data.CartProduct
import uz.malika.erp.features.sales.data.PosRepository
import uz.malika.erp.features.sales.data.ReceiptData
import uz.malika.erp.features.sales.data.SaleCreate
import uz.malika.erp.features.sales.data.ScanOutcome
import uz.malika.erp.features.sales.data.ScannedDevice
import uz.malika.erp.features.sales.lib.CartPricing
import uz.malika.erp.features.sales.lib.Discount
import uz.malika.erp.features.sales.lib.DiscountMode
import uz.malika.erp.features.sales.lib.DiscountSettings
import uz.malika.erp.features.sales.lib.PriceLevel
import uz.malika.erp.features.sales.lib.PricedCart
import uz.malika.erp.shared.payments.AccountAmount
import uz.malika.erp.shared.payments.PaymentSplit
import java.math.BigDecimal

/**
 * A resolved unit scan awaiting the cashier's confirmation. [device] is the
 * looked-up device (null when it did not resolve); [errorKey] is the i18n key of
 * the reason it cannot be added (null when addable). Confirm adds it to the cart.
 */
data class ScanPrompt(
    val code: String,
    val device: ScannedDevice? = null,
    val errorKey: String? = null,
) {
    val addable: Boolean get() = device != null && errorKey == null
}

data class PosState(
    val lines: List<CartLine> = emptyList(),
    val errorKey: String? = null,
    val busy: Boolean = false,
    val completed: ReceiptData? = null,
    val defaultWarrantyDays: Int? = null,
    val pendingSold: Set<String> = emptySet(),
    val prompt: ScanPrompt? = null,
    /** Quantity products matched by a typed name search, to pick from (ADR 0030). */
    val productMatches: List<CartProduct>? = null,
    // Pricing (ADR 0034).
    val level: String = PriceLevel.DEFAULT,
    val settings: DiscountSettings = DiscountSettings(),
    val standingPercent: BigDecimal = BigDecimal.ZERO,
    val canOverride: Boolean = false,
    val canUnlimited: Boolean = false,
    val cartDiscount: Discount? = null,
    val overriding: Set<String> = emptySet(),
    val standingPrefill: Boolean = false,
) {
    /** The whole cart priced at the current level — the single brain the UI reads. */
    val priced: PricedCart
        get() = CartPricing.price(lines, level, cartDiscount, overriding, settings, standingPercent, canOverride, canUnlimited)
    val total: String get() = priced.totals.payable.toPlainString()
}

/**
 * POS terminal state (ADR 0030/0031/0034): a mixed cart, a price level that
 * follows the customer, per-line and whole-cart discounts bounded by the owner's
 * limit, and the completed sale. Checkout fans the cart into one `sale.create`
 * per line (each carrying its level, discount and the till's list price), enqueued
 * to the outbox so it works identically online and offline.
 */
class PosViewModel(
    private val repo: PosRepository,
    private val cashierName: String,
    canOverride: Boolean = false,
    canUnlimited: Boolean = false,
) : ViewModel() {

    private val _state = MutableStateFlow(PosState(canOverride = canOverride, canUnlimited = canUnlimited))
    val state: StateFlow<PosState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            repo.watchPendingSoldImeis().collect { imeis -> _state.value = _state.value.copy(pendingSold = imeis) }
        }
        viewModelScope.launch {
            runCatching { repo.defaultWarrantyDays() }.getOrNull()?.let {
                _state.value = _state.value.copy(defaultWarrantyDays = it)
            }
        }
    }

    /** Load the discount settings (online fetch + cache, else last-known). Driven by PosScreen. */
    fun loadDiscountSettings(online: Boolean) {
        viewModelScope.launch {
            _state.value = _state.value.copy(settings = repo.discountSettings(online))
        }
    }

    fun scan(raw: String, online: Boolean) {
        _state.value = _state.value.copy(busy = true, errorKey = null, completed = null, prompt = null, productMatches = null)
        viewModelScope.launch {
            try {
                val code = raw.trim()
                when (val outcome = repo.scan(code, online)) {
                    is ScanOutcome.Unit -> promptUnit(code, outcome.device)
                    is ScanOutcome.Product -> addProduct(outcome.product)
                    ScanOutcome.NotFound -> notFound(code, online)
                }
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }

    private fun promptUnit(code: String, device: ScannedDevice) {
        val s = _state.value
        _state.value = s.copy(busy = false, prompt = ScanPrompt(code, device, unitErrorKey(s, device)))
    }

    private fun unitErrorKey(s: PosState, device: ScannedDevice): String? = when {
        s.pendingSold.contains(device.code) -> "pos.alreadyQueued"
        s.lines.any { it.key == device.code } -> "pos.duplicateDevice"
        !device.inStock -> "pos.deviceConflict"
        else -> null
    }

    fun addUnitFromCatalog(code: String, online: Boolean) {
        _state.value = _state.value.copy(busy = true, errorKey = null)
        viewModelScope.launch {
            try {
                when (val outcome = repo.scan(code, online)) {
                    is ScanOutcome.Unit -> addResolvedUnit(outcome.device)
                    else -> _state.value = _state.value.copy(busy = false, errorKey = "common.notFound")
                }
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }

    private fun addResolvedUnit(device: ScannedDevice) {
        val s = _state.value
        val errorKey = unitErrorKey(s, device)
        if (errorKey != null) {
            _state.value = s.copy(busy = false, errorKey = errorKey)
            return
        }
        _state.value = s.copy(busy = false, lines = s.lines + newUnitLine(device, s))
    }

    private fun notFound(code: String, online: Boolean) {
        viewModelScope.launch {
            val matches = if (online) repo.searchProducts(code, online) else emptyList()
            _state.value = _state.value.copy(
                busy = false,
                productMatches = matches.takeIf { it.isNotEmpty() },
                errorKey = if (matches.isEmpty()) "common.notFound" else null,
            )
        }
    }

    fun addProduct(product: CartProduct) {
        val s = _state.value
        val key = "model:${product.modelId}"
        val lines = if (s.lines.any { it.key == key }) {
            s.lines.map { if (it is CartLine.Quantity && it.key == key) it.copy(quantity = it.quantity + 1) else it }
        } else {
            s.lines + CartLine.Quantity(product, quantity = 1, unitPrice = product.salePrice ?: "")
        }
        _state.value = s.copy(busy = false, lines = lines, productMatches = null)
    }

    fun dismissProductMatches() { _state.value = _state.value.copy(productMatches = null) }

    fun confirmScan() {
        val s = _state.value
        val device = s.prompt?.takeIf { it.addable }?.device ?: return dismissScan()
        _state.value = s.copy(prompt = null, lines = s.lines + newUnitLine(device, s))
    }

    private fun newUnitLine(device: ScannedDevice, s: PosState) = CartLine.Unit(
        device = device,
        salePrice = device.targetPrice ?: "",
        warrantyDays = (s.defaultWarrantyDays ?: "").toString(),
    )

    fun dismissScan() { _state.value = _state.value.copy(prompt = null) }

    fun setLinePrice(key: String, price: String) = mapLine(key) {
        when (it) {
            is CartLine.Unit -> it.copy(salePrice = price)
            is CartLine.Quantity -> it.copy(unitPrice = price)
        }
    }

    fun setLineWarranty(key: String, days: String) = mapLine(key) {
        if (it is CartLine.Unit) it.copy(warrantyDays = days) else it
    }

    fun setLineQuantity(key: String, quantity: Int) = mapLine(key) {
        if (it is CartLine.Quantity) it.copy(quantity = quantity.coerceAtLeast(1)) else it
    }

    /** Set or clear a per-line discount; clears any whole-cart discount (one or the other). */
    fun setLineDiscount(key: String, discount: Discount?) {
        val lines = _state.value.lines.map {
            if (it.key != key) it else when (it) {
                is CartLine.Unit -> it.copy(discount = discount)
                is CartLine.Quantity -> it.copy(discount = discount)
            }
        }
        _state.value = _state.value.copy(lines = lines, cartDiscount = null, standingPrefill = false)
    }

    /** Set or clear the whole-cart discount; it spreads over the list-priced lines. */
    fun setCartDiscount(discount: Discount?) {
        _state.value = _state.value.copy(cartDiscount = discount, standingPrefill = false)
    }

    /** Switch the price level by hand; re-prices every line. */
    fun setLevel(level: String) { _state.value = _state.value.copy(level = level) }

    /**
     * The chosen customer drives the level and prefills their standing discount
     * (percent) — removable. No customer / none chosen falls back to walk-in and
     * clears a standing prefill.
     */
    fun applyCustomer(priceLevelCode: String?, standingPercent: BigDecimal) {
        val s = _state.value
        val level = priceLevelCode?.takeIf { it.isNotBlank() } ?: PriceLevel.DEFAULT
        val next = if (standingPercent.signum() > 0) {
            s.copy(level = level, standingPercent = standingPercent, cartDiscount = Discount(DiscountMode.PERCENT, standingPercent), standingPrefill = true)
        } else if (s.standingPrefill) {
            s.copy(level = level, standingPercent = BigDecimal.ZERO, cartDiscount = null, standingPrefill = false)
        } else {
            s.copy(level = level, standingPercent = BigDecimal.ZERO)
        }
        _state.value = next
    }

    /** Toggle "type a price" for a line (only effective for `sale.price.override`). */
    fun toggleOverride(key: String) {
        val s = _state.value
        if (!s.canOverride) return
        val next = if (key in s.overriding) s.overriding - key else s.overriding + key
        _state.value = s.copy(overriding = next)
    }

    fun removeLine(key: String) {
        _state.value = _state.value.copy(lines = _state.value.lines.filterNot { it.key == key })
    }

    private fun mapLine(key: String, f: (CartLine) -> CartLine) {
        _state.value = _state.value.copy(lines = _state.value.lines.map { if (it.key == key) f(it) else it })
    }

    fun clearError() { _state.value = _state.value.copy(errorKey = null) }
    fun dismissReceipt() { _state.value = _state.value.copy(completed = null) }

    /**
     * [parts] is the cart-level tender summing to the amount to pay; it is fanned
     * across the lines' final prices so each sale's payments add up to its line.
     */
    fun checkout(
        online: Boolean,
        customerId: String? = null,
        customerName: String? = null,
        customerPhone: String? = null,
        notes: String? = null,
        parts: List<AccountAmount> = emptyList(),
    ) {
        val s = _state.value
        val priced = s.priced
        if (priced.lines.isEmpty()) return
        priced.rejection?.let { _state.value = s.copy(errorKey = it.key); return }
        _state.value = s.copy(busy = true, errorKey = null)
        viewModelScope.launch {
            try {
                val finals = priced.lines.map { it.finalPrice }
                val allocation = if (parts.isEmpty()) emptyList() else PaymentSplit.allocate(finals, parts)
                val ops = SaleCreate.ops(priced.lines, s.level, customerId, customerName, customerPhone, notes, allocation)
                val ids = ops.map { repo.enqueueSale(it.payload, it.baseVersion) }
                _state.value = PosState(
                    pendingSold = s.pendingSold,
                    defaultWarrantyDays = s.defaultWarrantyDays,
                    settings = s.settings,
                    canOverride = s.canOverride,
                    canUnlimited = s.canUnlimited,
                    completed = buildPosReceipt(ids.first(), cashierName, s.level, priced, online, customerName, parts),
                )
            } catch (_: Exception) {
                _state.value = _state.value.copy(busy = false, errorKey = "common.error")
            }
        }
    }
}
