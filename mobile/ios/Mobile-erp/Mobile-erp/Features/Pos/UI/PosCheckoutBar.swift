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
            Button(action: { model.checkout() }) {
                if model.busy {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Label(i18n.t("pos.checkoutButton"), systemImage: "checkmark.circle")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(model.busy || !allPriced)
            .listRowInsets(EdgeInsets())
            .listRowBackground(Color.clear)
        }
    }
}
