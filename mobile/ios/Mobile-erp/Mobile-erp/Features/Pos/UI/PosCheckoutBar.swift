import SwiftUI

/// The sale totals, an optional whole-sale discount, the payment method and the
/// one checkout action (ADR 0034). Totals show the sum of list prices, what was
/// given away and the amount to pay; the pay button is disabled until every line
/// is priced, the payment is valid and no line's discount is over the limit.
struct PosCheckoutBar: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n
    @State private var showCartDiscount = false
    @State private var showTradeIn = false

    private var cart: PosCart { model.cart }
    private var allPriced: Bool { !cart.isEmpty && cart.lines.allSatisfy { cart.finalTotal($0) > 0 } }
    /// Trade-ins (ADR 0039): the payment is taken on the amount to pay (cart total
    /// minus the trade-ins), and the plan must place every trade-in on a line.
    private var hasTradeIns: Bool { cart.hasTradeIns }
    private var planOk: Bool { model.planCartTradeIns().ok }
    private var paymentValid: Bool { model.payment.isValid(total: model.amountToPay) }
    private var hasDiscount: Bool { cart.totalDiscount > 0 }
    /// Shifts (ADR 0036): selling is blocked until a shift is open.
    private var shiftBlocked: Bool { model.shift.blocksSale(online: model.isOnline) }

    var body: some View {
        VStack(spacing: Tokens.Space.lg) {
            totalsCard
            if cart.config.enabled && cart.subtotalList > 0 { cartDiscountButton }
            if model.tradeInAvailable { tradeInButton }
            if hasTradeIns && !planOk, let label = model.unplaceableTradeInLabel() {
                Text(i18n.t("purchases.tradeInExceedsLine", ["model": label],
                            default: "The trade-in is worth more than any single phone in the cart"))
                    .font(.ui(.caption)).foregroundStyle(Tokens.danger)
            }
            if shiftBlocked { shiftBlock }
            PosBonusRedeemControl(model: model)
            AppFormField(label: i18n.t("balance.paidWith")) {
                PaymentMethodField(selection: model.payment, total: model.amountToPay)
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
            .disabled(model.busy || !allPriced || !paymentValid || cart.hasInvalidDiscount || shiftBlocked || !planOk)
            // Credit is not offered with a trade-in (ADR 0039) or bonus points (ADR 0043).
            if model.creditAvailable && !hasTradeIns && model.bonusRedeemTotal == 0 { creditButton }
        }
        .sheet(isPresented: $showCartDiscount) {
            PosDiscountSheet(
                title: i18n.t("pricing.discountOnCart"), list: cart.subtotalList, config: cart.config,
                cap: PricingMath.cap(cashierMax: cart.config.cashierMax, standing: cart.standingPercent),
                initialMode: .none, initialValue: "",
                onApply: { mode, value in _ = cart.applyCartDiscount(mode: mode, value: Decimal(string: value) ?? 0) },
                onClear: { cart.clearAllDiscounts() })
        }
        .sheet(isPresented: $showTradeIn) {
            PosTradeInSheet { model.addTradeIn($0) }
        }
        #if DEBUG
        // Screenshot helper: open the trade-in sheet when seeded (`-posTradeInSheet`).
        .onAppear { if model.tradeInAvailable, KitDebugLaunch.consume("posTradeInSheet") != nil { showTradeIn = true } }
        #endif
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
                FactRow(label: i18n.t("pos.subtotal"), last: !hasTradeIns && model.bonusRedeemTotal == 0) {
                    Text(MoneyText.format(NSDecimalNumber(decimal: cart.subtotal).stringValue))
                        .font(.data(.large)).foregroundStyle(Tokens.text)
                }
                if hasTradeIns {
                    FactRow(label: i18n.t("purchases.tradeInLabel", default: "Trade-in")) {
                        Text("− \(MoneyText.format(NSDecimalNumber(decimal: model.tradeInTotal).stringValue))")
                            .font(.data(.regular)).foregroundStyle(Tokens.success)
                    }
                }
                if model.bonusRedeemTotal > 0 {
                    FactRow(label: i18n.t("pos.bonusPoints")) {
                        Text("− \(BonusText.format(NSDecimalNumber(decimal: model.bonusRedeemTotal).stringValue))")
                            .font(.data(.regular)).foregroundStyle(Tokens.success)
                    }
                }
                if hasTradeIns || model.bonusRedeemTotal > 0 {
                    FactRow(label: i18n.t("purchases.amountPaid", default: "Amount to pay"), last: true) {
                        Text(MoneyText.format(NSDecimalNumber(decimal: model.amountToPay).stringValue))
                            .font(.data(.large)).foregroundStyle(Tokens.text)
                    }
                }
            }
        }
    }

    /// Trade-in (ADR 0039): online only and needs a customer. Each phone taken in
    /// opens the add sheet; the rows live in the cart column (removable).
    @ViewBuilder private var tradeInButton: some View {
        Button { showTradeIn = true } label: {
            Label(i18n.t("purchases.tradeInAction", default: "Trade-in"), systemImage: "arrow.left.arrow.right")
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillSecondary)
        .disabled(!model.isOnline || !model.tradeInHasCustomer)
        if !model.isOnline {
            Text(i18n.t("purchases.tradeInOffline", default: "Trade-in is available online only"))
                .font(.ui(.caption)).foregroundStyle(Tokens.muted)
        } else if !model.tradeInHasCustomer {
            Text(i18n.t("purchases.tradeInNeedsCustomer", default: "Choose a customer to take a trade-in"))
                .font(.ui(.caption)).foregroundStyle(Tokens.muted)
        }
    }

    /// Shifts (ADR 0036): a clear message + an "Open shift" button when selling is
    /// blocked because no shift is open.
    private var shiftBlock: some View {
        VStack(spacing: Tokens.Space.sm) {
            Text(i18n.t("shifts.shiftRequired")).font(.ui(.body)).foregroundStyle(Tokens.danger)
            Button { model.shift.showOpen = true } label: {
                Label(i18n.t("shifts.openShift"), systemImage: "clock").frame(maxWidth: .infinity)
            }
            .buttonStyle(.pillSecondary)
        }
    }

    /// "On credit" (ADR 0035): online only — disabled offline with a clear note.
    @ViewBuilder private var creditButton: some View {
        Button { model.showCredit = true } label: {
            Label(i18n.t("credit.payOnCredit"), systemImage: "banknote").frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillSecondary)
        .disabled(!allPriced || !model.isOnline)
        if !model.isOnline {
            Text(i18n.t("credit.errorOffline")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
        }
    }

    private var cartDiscountButton: some View {
        Button { showCartDiscount = true } label: {
            Label(i18n.t("pricing.discountOnCart"), systemImage: "percent").frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillSecondary)
    }
}
