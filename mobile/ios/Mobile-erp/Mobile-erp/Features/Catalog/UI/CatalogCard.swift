import SwiftUI

/// One tappable product card in the till grid (ADR 0031): a square picture (or a
/// neutral placeholder), the name, how many are in stock and the price — a range
/// for a unit product, the price per piece for a quantity product. A white Warm
/// Card; the whole card is the pressable thing, so the price stays `text`, never
/// the reserved action orange.
struct CatalogCard: View {
    let entry: CatalogEntry
    let onTap: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 0) {
                ProductImageView(path: entry.imageUrl, cornerRadius: 0)
                    .aspectRatio(1, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                    Text(entry.label)
                        .font(.ui(.bodyStrong))
                        .foregroundStyle(Tokens.text)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text(i18n.t("catalog.inStockCount", ["count": String(entry.inStock)]))
                        .font(.ui(.caption))
                        .foregroundStyle(entry.lowStock ? Tokens.danger : Tokens.muted)
                    Text(priceLabel)
                        .font(.mono(14, weight: .semibold))
                        .foregroundStyle(Tokens.text)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .padding(.top, Tokens.Space.xs)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(Tokens.Space.md)
            }
            .background(Tokens.card)
            .clipShape(RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    /// Range for a unit product (ADR 0031), price per piece for a quantity one.
    private var priceLabel: String {
        if entry.isQuantity { return MoneyText.format(entry.salePrice ?? "0") }
        guard let min = entry.minTargetPrice else { return "—" }
        guard let max = entry.maxTargetPrice, max != min else { return MoneyText.format(min) }
        return "\(MoneyText.format(min)) – \(MoneyText.format(max))"
    }
}
