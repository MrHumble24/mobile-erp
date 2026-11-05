import SwiftUI

/// The in-stock units of a tapped unit product (ADR 0031): the seller picks the
/// one to sell. Shown only when more than one is free (one goes straight to the
/// cart). Code in mono, storage · colour, the latest QC grade and the price.
struct CatalogUnitPickerSheet: View {
    let entry: CatalogEntry
    let units: [CatalogUnit]
    /// The current price level (ADR 0034) — each unit shows that level's price.
    var level: String = PriceLevels.retail
    let onPick: (CatalogUnit) -> Void

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                    Text(i18n.t("catalog.pickUnit")).font(.ui(.title)).foregroundStyle(Tokens.text)
                    Text(entry.label).font(.ui(.body)).foregroundStyle(Tokens.muted)
                }
                if units.isEmpty {
                    EmptyStateView(systemImage: "shippingbox", title: i18n.t("catalog.noUnits"))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Tokens.Space.gutter)
                } else {
                    VStack(spacing: Tokens.Space.md) {
                        ForEach(units) { unit in unitRow(unit) }
                    }
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
    }

    private func unitRow(_ unit: CatalogUnit) -> some View {
        Button { onPick(unit); dismiss() } label: {
            AppCard {
                HStack(alignment: .center, spacing: Tokens.Space.md) {
                    VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                        Text(unit.code).font(.data(.regular)).foregroundStyle(Tokens.text)
                        if let facts = factsLine(unit) {
                            Text(facts).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                        }
                    }
                    Spacer(minLength: Tokens.Space.sm)
                    VStack(alignment: .trailing, spacing: Tokens.Space.xs) {
                        if let grade = unit.gradeCode {
                            StatusBadge("\(i18n.t("catalog.grade")) \(grade)", color: Tokens.info)
                        }
                        MoneyText(value: unit.prices.price(level) ?? unit.targetPrice ?? "0", size: 15)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    /// "256 GB · Black" — the storage then the colour, whichever are set.
    private func factsLine(_ unit: CatalogUnit) -> String? {
        let parts = [unit.storage, unit.color].compactMap { $0 }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }
}
