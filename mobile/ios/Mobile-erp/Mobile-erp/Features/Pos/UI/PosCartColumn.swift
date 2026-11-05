import SwiftUI

/// The shared cart: the line count, each unit/quantity line, the customer panel
/// and the checkout bar — or the empty landing. One column reused by scan mode
/// (inline), the phone catalog cart sheet and the iPad catalog side panel, so
/// both till modes feed and show the same cart.
struct PosCartColumn: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n

    var body: some View {
        if model.cart.isEmpty {
            PosEmptyScanLanding()
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
        } else {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                Text(i18n.t("pos.lineCount", ["count": String(model.cart.count)]))
                    .font(.ui(.caption))
                    .foregroundStyle(Tokens.muted)
                VStack(spacing: Tokens.Space.lg) {
                    ForEach(model.cart.lines) { line in
                        PosCartLineRow(cart: model.cart, line: line)
                            .captureSpringRow()
                    }
                }
                .captureSpringList(model.cart.lines.map(\.id), count: model.cart.count)
                PosCustomerPanel(model: model)
                PosCheckoutBar(model: model)
            }
        }
    }
}
