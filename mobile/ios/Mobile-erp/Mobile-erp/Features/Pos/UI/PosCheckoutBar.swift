import SwiftUI

/// Cart total + the single checkout action. The total is a 24 pt mono figure on
/// a white card; the full-width orange pay button is the one `action` on the
/// screen. Disabled until every line has a positive price.
struct PosCheckoutBar: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n

    private var cart: PosCart { model.cart }
    private var allPriced: Bool {
        !cart.isEmpty && cart.lines.allSatisfy { moneyToDouble($0.price) > 0 }
    }

    var body: some View {
        VStack(spacing: Tokens.Space.lg) {
            AppCard {
                HStack {
                    Text(i18n.t("pos.subtotal"))
                        .font(.ui(.body))
                        .foregroundStyle(Tokens.muted)
                    Spacer()
                    Text(MoneyText.format(NSDecimalNumber(decimal: cart.subtotal).stringValue))
                        .font(.data(.large))
                        .foregroundStyle(Tokens.text)
                }
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
            .disabled(model.busy || !allPriced)
        }
    }
}
