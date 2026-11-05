import Foundation

/// The till's bridge to customer credit (ADR 0035). The "On credit" action is
/// offered only when the shop has the setting on and the user has `sale.credit`;
/// it builds the cart's lines as `CreditLinePost`s (the same priced lines a sale
/// sends) and hands them to the credit sheet, which takes the down payment and
/// plan and posts `POST /credits`. Credit is online only.
extension PosViewModel {
    /// Whether to show the "On credit" entry at all (setting on + permission).
    var creditAvailable: Bool {
        creditEnabled && (container?.session.can("sale.credit") ?? false)
    }

    /// Online now — credit is refused offline (never queued).
    var isOnline: Bool { container?.connectivity.isOnline ?? false }

    /// The cart's customer id (credit needs a saved customer with a phone).
    var creditCustomerId: String? { cart.customer?.id }
    var creditCustomerName: String? { cart.customer?.name }
    var creditCustomerPhone: String? { cart.customer?.phone }

    /// The cart as `POST /credits` lines — the same priced line a sale sends
    /// (final price, level and discount), with no payment (the down payment and
    /// plan are entered in the sheet).
    func creditLines() -> [CreditLinePost] {
        cart.lines.map { line in
            let total = NSDecimalNumber(decimal: cart.finalTotal(line)).doubleValue
            let list = cart.listPrice(line)
            let discount: CreditDiscountPost? = {
                guard list != nil, !line.priceOverridden,
                      line.discountMode != .none, line.discountDecimal > 0 else { return nil }
                return CreditDiscountPost(
                    mode: line.discountMode == .percent ? "PERCENT" : "AMOUNT",
                    value: NSDecimalNumber(decimal: line.discountDecimal).doubleValue)
            }()
            if let product = line.product {
                return CreditLinePost(
                    imei: nil, serialNumber: nil, modelId: product.modelId,
                    quantity: line.quantity, salePrice: total,
                    priceLevelCode: nonEmpty(cart.level), discount: discount,
                    warrantyDays: nil, notes: nonEmpty(line.notes))
            }
            return CreditLinePost(
                imei: nonEmpty(line.device?.imei), serialNumber: nonEmpty(line.device?.serialNumber),
                modelId: nil, quantity: nil, salePrice: total,
                priceLevelCode: nonEmpty(cart.level), discount: discount,
                warrantyDays: Int(line.warrantyDays.trimmingCharacters(in: .whitespaces)),
                notes: nonEmpty(line.notes))
        }
    }

    /// Clear the cart after a credit is sold (mirrors a completed checkout).
    func onCreditSold() {
        cart.clear()
        payment.method = .cash
        payment.splitAmounts = [:]
        showCart = false
    }
}
