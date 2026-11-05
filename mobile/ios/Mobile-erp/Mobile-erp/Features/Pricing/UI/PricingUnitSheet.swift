import SwiftUI

/// Set one unit's own three prices (ADR 0034, `price.manage`). Empty means "use
/// the product price" — the resolved price that then applies is shown as a hint.
/// RETAIL writes the unit's `targetPrice`. Saved in one `PUT /pricing/units`.
struct PricingUnitSheet: View {
    let deviceId: String
    let label: String
    /// The unit's currently-resolved prices, to hint what applies when blank.
    var resolved: PriceLevelPrices = PriceLevelPrices()
    var onSaved: () -> Void = {}

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var cells: [String: String] = [:]
    @State private var loaded = false
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                header
                if loaded {
                    Text(i18n.t("pricing.unitPricesHint"))
                        .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    AppCard {
                        PricingLevelFields(
                            text: { cells[$0] ?? "" },
                            setText: { cells[$0] = $1 },
                            resolvedHint: resolvedHint)
                    }
                    if let error { Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger) }
                    saveButton
                } else {
                    LoadingView().frame(maxWidth: .infinity).padding(.vertical, Tokens.Space.gutter)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task { await load() }
    }

    private var header: some View {
        HStack(alignment: .top, spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                Text(i18n.t("pricing.unitPrices")).font(.ui(.title)).foregroundStyle(Tokens.text)
                Text(label).font(.ui(.body)).foregroundStyle(Tokens.muted)
            }
            Spacer(minLength: Tokens.Space.sm)
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .semibold)).foregroundStyle(Tokens.text)
                    .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                    .background(Tokens.surface2, in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(i18n.t("common.cancel"))
        }
    }

    private var saveButton: some View {
        Button { Task { await save() } } label: {
            Text(saving ? i18n.t("common.loading") : i18n.t("common.save")).frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillPrimary)
        .disabled(saving || !container.connectivity.isOnline)
    }

    private func resolvedHint(_ level: String) -> String? {
        guard let price = resolved.price(level) else { return nil }
        return "\(i18n.t("pricing.listPrice")): \(MoneyText.format(price))"
    }

    private func load() async {
        guard !loaded else { return }
        do {
            let view = try await PricingRepository(container).unitPrices(deviceId)
            for row in view.prices where row.price != nil { cells[row.levelCode] = row.price }
        } catch { /* show empty fields; the hint still shows the resolved price */ }
        loaded = true
    }

    private func save() async {
        saving = true
        error = nil
        defer { saving = false }
        let entries: [(levelCode: String, price: Decimal?)] = PriceLevels.all.map { level in
            let raw = (cells[level] ?? "").trimmingCharacters(in: .whitespaces)
            return (level, raw.isEmpty ? nil : Decimal(string: raw))
        }
        do {
            try await PricingRepository(container).setUnitPrices(deviceId, entries)
            container.toasts.success(i18n.t("pricing.pricesSaved"))
            onSaved()
            dismiss()
        } catch let e as AppError {
            error = e.message
        } catch {
            self.error = i18n.t("common.error")
        }
    }
}
