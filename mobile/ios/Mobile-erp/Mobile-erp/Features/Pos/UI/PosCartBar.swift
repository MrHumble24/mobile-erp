import SwiftUI

/// Persistent cart bar for phone catalog mode (ADR 0031): the grid fills the
/// screen, so the cart stays reachable without scrolling past it. Shows the line
/// count and running total; tapping opens the cart + checkout. The one action
/// orange on the catalog screen. Hidden affordance when the cart is empty.
struct PosCartBar: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n

    private var total: String { MoneyText.format(NSDecimalNumber(decimal: model.cart.subtotal).stringValue) }

    var body: some View {
        Button { model.showCart = true } label: {
            HStack(spacing: Tokens.Space.sm) {
                Image(systemName: "cart.fill").font(.system(size: 16, weight: .semibold))
                Text(i18n.t("pos.lineCount", ["count": String(model.cart.count)]))
                    .font(.ui(.bodyStrong))
                Spacer(minLength: Tokens.Space.sm)
                Text(total).font(.data(.regular))
                Image(systemName: "chevron.up").font(.system(size: 13, weight: .semibold))
            }
        }
        .buttonStyle(.pillPrimary)
        .disabled(model.cart.isEmpty)
        .padding(.horizontal, Tokens.Space.gutter)
        .padding(.top, Tokens.Space.sm)
        .padding(.bottom, Tokens.Space.md)
        .background(Tokens.ground)
    }
}
