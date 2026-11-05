import Foundation
import Observation

/// The POS cart: the units and quantity products queued for checkout, the shared
/// customer and the current price level (ADR 0034). One sale request per line.
/// Pricing is computed from each line's resolved list prices for the current
/// level minus its discount; a line with no list price keeps the old behaviour
/// (the seller types the price). Client-only state.
@MainActor
@Observable
final class PosCart {
    private(set) var lines: [PosCartLine] = []
    var customer: PosCartCustomer?
    /// The chosen price level; follows the customer, the seller may switch it.
    var level: String = PriceLevels.defaultCode
    /// Discount rules + the user's price permissions, set when settings load.
    var config = PosDiscountConfig()

    var isEmpty: Bool { lines.isEmpty }
    var count: Int { lines.count }

    /// The customer's standing discount percent (0 when none / walk-in).
    var standingPercent: Decimal { customer?.standing ?? 0 }

    // MARK: - Pricing (all derived from `level` + each line's discount)

    /// The whole-line list price for the current level, or nil when none is set.
    func listPrice(_ line: PosCartLine) -> Decimal? { line.listPrice(level) }

    /// The rounded discount amount for a line (0 when none / overridden / no list).
    func discountAmount(_ line: PosCartLine) -> Decimal {
        guard let list = listPrice(line), !line.priceOverridden else { return 0 }
        return PricingMath.discountAmount(mode: line.discountMode, value: line.discountDecimal, list: list)
    }

    /// The payable total for a line: list − discount, or the typed price when the
    /// line has no list price or the seller overrode it.
    func finalTotal(_ line: PosCartLine) -> Decimal {
        guard let list = listPrice(line), !line.priceOverridden else { return line.lineTotal }
        return PricingMath.finalPrice(list: list, mode: line.discountMode, value: line.discountDecimal)
    }

    /// The `pricing.error…` key for a line's discount that the server would
    /// reject, or nil when it is fine. Only list-priced, non-overridden lines.
    func validationErrorKey(_ line: PosCartLine) -> String? {
        guard let list = listPrice(line), !line.priceOverridden,
              line.discountMode != .none, line.discountDecimal > 0 else { return nil }
        if !config.enabled { return "pricing.errorDiscountDisabled" }
        let cap = PricingMath.cap(cashierMax: config.cashierMax, standing: standingPercent)
        return PricingMath.validate(mode: line.discountMode, value: line.discountDecimal,
                                    list: list, cap: cap, unlimited: config.canDiscountUnlimited)
    }

    /// Any line's discount is invalid → checkout is blocked.
    var hasInvalidDiscount: Bool { lines.contains { validationErrorKey($0) != nil } }

    /// Sum of the list prices (the typed price for a line with no list price).
    var subtotalList: Decimal { lines.reduce(.zero) { $0 + (listPrice($1) ?? $1.lineTotal) } }
    /// The amount to pay — the sum of the final line totals. The payment split
    /// works on this.
    var subtotal: Decimal { lines.reduce(.zero) { $0 + finalTotal($1) } }
    /// What was given away: the list total minus the amount to pay.
    var totalDiscount: Decimal { subtotalList - subtotal }

    // MARK: - Level & customer

    /// Switch the price level by hand (re-prices every line via the computeds).
    func setLevel(_ value: String) { level = value }

    /// Attach a customer and follow their level + standing discount.
    func attach(_ customer: PosCartCustomer) {
        self.customer = customer
        level = customer.level
        applyStanding()
    }

    func detachCustomer() { customer = nil }

    /// Prefill the customer's standing discount on every list-priced line that
    /// has no manual discount yet (percent mode); the seller may remove it.
    func applyStanding() {
        guard config.enabled, config.percentAllowed, standingPercent > 0 else { return }
        for i in lines.indices where lines[i].discountMode == .none && !lines[i].priceOverridden
            && listPrice(lines[i]) != nil {
            lines[i].discountMode = .percent
            lines[i].discountValue = NSDecimalNumber(decimal: standingPercent).stringValue
        }
    }

    // MARK: - Lines

    @discardableResult
    func add(_ device: ScannedDevice, warrantyDays: Int?) -> Bool {
        guard !lines.contains(where: { $0.device?.code == device.code }) else { return false }
        lines.append(PosCartLine(
            id: newUUID(), device: device, product: nil,
            price: device.targetPrice ?? "", quantity: 1,
            warrantyDays: warrantyDays.map(String.init) ?? "", notes: "",
            clientMutationId: newUUID()))
        prefillStanding(at: lines.count - 1)
        return true
    }

    func addProduct(_ product: PosCartProduct) {
        if let i = lines.firstIndex(where: { $0.product?.modelId == product.modelId }) {
            lines[i].quantity += 1
            return
        }
        lines.append(PosCartLine(
            id: newUUID(), device: nil, product: product,
            price: product.salePrice ?? "", quantity: 1,
            warrantyDays: "", notes: "", clientMutationId: newUUID()))
        prefillStanding(at: lines.count - 1)
    }

    func remove(_ id: String) { lines.removeAll { $0.id == id } }
    func clear() { lines = []; customer = nil; level = PriceLevels.defaultCode }

    func setPrice(_ id: String, _ value: String) { patch(id) { $0.price = value } }
    func setWarranty(_ id: String, _ value: String) { patch(id) { $0.warrantyDays = value } }
    func setNotes(_ id: String, _ value: String) { patch(id) { $0.notes = value } }
    func setQuantity(_ id: String, _ value: Int) { patch(id) { $0.quantity = max(1, value) } }

    /// Set a line's discount (percent or amount).
    func setDiscount(_ id: String, mode: PosDiscountMode, value: String) {
        patch(id) { $0.discountMode = mode; $0.discountValue = value; $0.priceOverridden = false }
    }
    func clearDiscount(_ id: String) {
        patch(id) { $0.discountMode = .none; $0.discountValue = "" }
    }
    /// Clear every line's discount (used when the whole-sale discount is removed).
    func clearAllDiscounts() {
        for i in lines.indices { lines[i].discountMode = .none; lines[i].discountValue = "" }
    }
    /// Override a line's price (needs `sale.price.override`): clears the discount.
    func overridePrice(_ id: String, _ value: String) {
        patch(id) { $0.priceOverridden = true; $0.price = value; $0.discountMode = .none; $0.discountValue = "" }
    }
    func clearOverride(_ id: String) { patch(id) { $0.priceOverridden = false } }

    /// Spread a whole-sale discount over the list-priced lines in proportion to
    /// their list prices, ending as per-line AMOUNT discounts that sum exactly to
    /// the cart discount. Returns a `pricing.error…` key when refused, else nil.
    func applyCartDiscount(mode: PosDiscountMode, value: Decimal) -> String? {
        guard config.enabled, mode != .none, value > 0 else { return nil }
        let list = subtotalList
        let cartAmount = PricingMath.discountAmount(mode: mode, value: value, list: list)
        guard cartAmount > 0 else { return nil }
        if cartAmount > list { return "pricing.errorDiscountAboveList" }
        if !config.canDiscountUnlimited {
            let cap = PricingMath.cap(cashierMax: config.cashierMax, standing: standingPercent)
            let percent = list > 0 ? cartAmount / list * 100 : 0
            if percent - Decimal(string: "0.0001")! > cap { return "pricing.errorDiscountTooHigh" }
        }
        let weights = lines.map { listPrice($0) ?? 0 }
        let parts = PricingMath.spread(cartDiscount: cartAmount, lineLists: weights)
        for i in lines.indices {
            if weights[i] > 0 && parts[i] > 0 {
                lines[i].discountMode = .amount
                lines[i].discountValue = NSDecimalNumber(decimal: parts[i]).stringValue
                lines[i].priceOverridden = false
            }
        }
        return nil
    }

    private func prefillStanding(at index: Int) {
        guard config.enabled, config.percentAllowed, standingPercent > 0,
              index < lines.count, listPrice(lines[index]) != nil,
              lines[index].discountMode == .none, !lines[index].priceOverridden else { return }
        lines[index].discountMode = .percent
        lines[index].discountValue = NSDecimalNumber(decimal: standingPercent).stringValue
    }

    private func patch(_ id: String, _ change: (inout PosCartLine) -> Void) {
        guard let i = lines.firstIndex(where: { $0.id == id }) else { return }
        change(&lines[i])
    }
}
