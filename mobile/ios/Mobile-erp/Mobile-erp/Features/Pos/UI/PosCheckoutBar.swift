import SwiftUI

/// Cart totals + the checkout action. Disabled until every line has a positive
/// price. One tap checks out all lines (one sale per device).
struct PosCheckoutBar: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n

    private var cart: PosCart { model.cart }
    private var allPriced: Bool {
        !cart.isEmpty && cart.lines.allSatisfy { moneyToDouble($0.price) > 0 }
    }

    var body: some View {
        Section {
            LabeledContent(i18n.t("pos.lineCount")) { Text("\(cart.count)") }
            LabeledContent(i18n.t("pos.subtotal")) {
                MoneyText(value: NSDecimalNumber(decimal: cart.subtotal).stringValue)
            }
            Button(action: {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                model.checkout()
            }) {
                if model.busy {
                    ProgressView().frame(maxWidth: .infinity).frame(height: 24)
                } else {
                    Label(i18n.t("pos.checkoutButton"), systemImage: "checkmark.circle.fill")
                        .font(.headline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 24)
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Tokens.ink)
            .disabled(model.busy || !allPriced)
            .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
            .listRowBackground(Color.clear)
        }
    }
}
