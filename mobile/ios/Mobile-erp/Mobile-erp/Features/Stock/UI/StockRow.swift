import SwiftUI

/// One quantity product as a Warm Card: name + barcode/model code on the left,
/// the on-hand quantity (danger when below zero, a badge at zero), the price and
/// — for cost users — the average cost and value on the right.
struct StockRow: View {
    let level: StockLevel
    let canViewCost: Bool
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(level.label).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    if let barcode = level.barcode, !barcode.isEmpty {
                        Text(barcode).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    }
                    if let code = level.modelCode, !code.isEmpty {
                        Text(code).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    if canViewCost, let avg = level.averageCost {
                        HStack(spacing: Tokens.Space.xs) {
                            Text(i18n.t("catalog.averageCost")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                            MoneyText(value: avg, size: 12).foregroundStyle(Tokens.muted)
                        }
                    }
                }
                Spacer(minLength: Tokens.Space.sm)
                VStack(alignment: .trailing, spacing: Tokens.Space.xs) {
                    Text("\(level.quantity)")
                        .font(.data(.large))
                        .foregroundStyle(level.isBelowZero ? Tokens.danger : Tokens.text)
                    if level.isBelowZero {
                        StatusBadge(i18n.t("catalog.belowZero"), color: Tokens.danger)
                    } else if level.isOutOfStock {
                        StatusBadge(i18n.t("catalog.outOfStock"), color: Tokens.warning)
                    }
                    if let price = level.salePrice {
                        MoneyText(value: price, size: 14).foregroundStyle(Tokens.text)
                    }
                    if canViewCost, let value = level.value {
                        MoneyText(value: value, size: 12).foregroundStyle(Tokens.muted)
                    }
                }
            }
        }
    }
}
