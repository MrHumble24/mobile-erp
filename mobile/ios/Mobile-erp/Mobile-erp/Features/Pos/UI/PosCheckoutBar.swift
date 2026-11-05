import SwiftUI

/// The sale totals, an optional whole-sale discount, the payment method and the
/// one checkout action (ADR 0034). Totals show the sum of list prices, what was
/// given away and the amount to pay; the pay button is disabled until every line
/// is priced, the payment is valid and no line's discount is over the limit.
struct PosCheckoutBar: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n
    @State private var showCartDiscount = false

    private var cart: PosCart { model.cart }
    private var allPriced: Bool { !cart.isEmpty && cart.lines.allSatisfy { cart.finalTotal($0) > 0 } }
    private var paymentValid: Bool { model.payment.isValid(total: cart.subtotal) }
    private var hasDiscount: Bool { cart.totalDiscount > 0 }

    var body: some View {
        VStack(spacing: Tokens.Space.lg) {
            totalsCard
            if cart.config.enabled && cart.subtotalList > 0 { cartDiscountButton }
            AppFormField(label: i18n.t("balance.paidWith")) {
                PaymentMethodField(selection: model.payment, total: cart.subtotal)
            }
            Button {
                model.checkout()
            } label: {
                if model.busy {
                    ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity)
                } else {
                    Text(i18n.t("pos.checkoutButton")).frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.pillPrimary)
            .disabled(model.busy || !allPriced || !paymentValid || cart.hasInvalidDiscount)
        }
        .sheet(isPresented: $showCartDiscount) {
            PosDiscountSheet(
                title: i18n.t("pricing.discountOnCart"), list: cart.subtotalList, config: cart.config,
                cap: PricingMath.cap(cashierMax: cart.config.cashierMax, standing: cart.standingPercent),
                initialMode: .none, initialValue: "",
                onApply: { mode, value in _ = cart.applyCartDiscount(mode: mode, value: Decimal(string: value) ?? 0) },
                onClear: { cart.clearAllDiscounts() })
        }
    }

    private var totalsCard: some View {
        AppCard {
            VStack(spacing: 0) {
                if hasDiscount {
                    FactRow(label: i18n.t("pricing.listPrice")) {
                        MoneyText(value: NSDecimalNumber(decimal: cart.subtotalList).stringValue, size: 15)
                    }
                    FactRow(label: i18n.t("pricing.discount")) {
                        Text("− \(MoneyText.format(NSDecimalNumber(decimal: cart.totalDiscount).stringValue))")
                            .font(.data(.regular)).foregroundStyle(Tokens.success)
                    }
                }
                FactRow(label: i18n.t("pos.subtotal"), last: true) {
                    Text(MoneyText.format(NSDecimalNumber(decimal: cart.subtotal).stringValue))
                        .font(.data(.large)).foregroundStyle(Tokens.text)
                }
            }
        }
    }

    private var cartDiscountButton: some View {
        Button { showCartDiscount = true } label: {
            Label(i18n.t("pricing.discountOnCart"), systemImage: "percent").frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillSecondary)
    }
}
