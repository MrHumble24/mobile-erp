import Foundation

/// The till's trade-in bridge (Change 14, ADR 0039). A phone the customer gives
/// in part payment lowers what they pay. A sale with a trade-in needs
/// `purchase.create` as well as `sale.create`, a named customer, and the
/// connection — it is online only and never queued.
extension PosViewModel {
    /// Whether to offer the Trade-in action at all (the purchase permission).
    var tradeInAvailable: Bool { container?.session.can("purchase.create") ?? false }

    /// Σ of the cart's trade-in values (netted off what the customer pays).
    var tradeInTotal: Decimal { cart.tradeIns.reduce(.zero) { $0 + $1.value } }

    /// What the customer still tenders: the cart total minus the trade-ins.
    var amountToPay: Decimal { cart.subtotal - tradeInTotal }

    /// A trade-in needs a named customer (an existing one or an inline name).
    var tradeInHasCustomer: Bool {
        guard let c = cart.customer else { return false }
        return c.id != nil || !c.name.trimmingCharacters(in: .whitespaces).isEmpty
    }

    /// The trade-in allocation over the current cart lines (pure, ADR 0039).
    func planCartTradeIns() -> TradeInAllocation.Plan {
        TradeInAllocation.plan(
            lines: cart.lines.map { .init(id: $0.id, price: cart.finalTotal($0)) },
            items: cart.tradeIns.map { .init(id: $0.id, value: $0.value) })
    }

    /// The model label of the trade-in no single line could carry (for the
    /// "worth more than any phone" message), or nil when the plan is fine.
    func unplaceableTradeInLabel() -> String? {
        let plan = planCartTradeIns()
        guard !plan.ok, let id = plan.unplaceableId else { return nil }
        return cart.tradeIns.first { $0.id == id }?.modelLabel
    }

    func addTradeIn(_ t: PosTradeIn) { cart.addTradeIn(t) }
    func removeTradeIn(_ id: String) { cart.removeTradeIn(id) }
}
