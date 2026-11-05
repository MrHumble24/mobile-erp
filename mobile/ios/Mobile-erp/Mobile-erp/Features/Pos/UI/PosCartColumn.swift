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
                if model.cart.hasTradeIns { PosTradeInRows(model: model) }
                PosCustomerPanel(model: model)
                PosCheckoutBar(model: model)
            }
        }
    }
}

/// The trade-in rows in the cart (ADR 0039): each traded-in phone with a minus
/// amount, removable. Online only; the add action lives in the checkout bar.
private struct PosTradeInRows: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(spacing: 0) {
                ForEach(model.cart.tradeIns) { t in
                    HStack(alignment: .center, spacing: Tokens.Space.sm) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(t.modelLabel).font(.ui(.body)).foregroundStyle(Tokens.text)
                            if !t.code.isEmpty {
                                Text(t.code).font(.data(.regular)).foregroundStyle(Tokens.muted)
                            }
                        }
                        Spacer(minLength: Tokens.Space.sm)
                        Text("− \(MoneyText.format(NSDecimalNumber(decimal: t.value).stringValue))")
                            .font(.data(.regular)).foregroundStyle(Tokens.success)
                        Button { model.removeTradeIn(t.id) } label: {
                            Image(systemName: "xmark.circle.fill").foregroundStyle(Tokens.muted)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(i18n.t("common.clear", default: "Remove"))
                    }
                    .frame(minHeight: Tokens.Space.rowH)
                }
            }
        }
    }
}
