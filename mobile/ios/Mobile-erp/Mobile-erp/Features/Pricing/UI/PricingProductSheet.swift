import SwiftUI

/// Set a product's three prices per storage (ADR 0034, `price.manage`). A
/// compact editor of storage × level with an "any storage" row; a quantity
/// product has only the any-storage row. Saved in one `PUT /pricing/products`.
/// Online-only — a plain owner write.
struct PricingProductSheet: View {
    let model: DeviceModelView
    var onSaved: () -> Void = {}

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var store: PricingProductModel?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                header
                if let store {
                    Text(i18n.t("pricing.productPricesHint"))
                        .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    ForEach(store.storages, id: \.self) { storage in
                        storageCard(store, storage)
                    }
                    if let error = store.error {
                        Text(error).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                    }
                    saveButton(store)
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
        .task {
            guard store == nil else { return }
            let s = PricingProductModel(
                modelId: model.id, isQuantity: model.kindCode == "QUANTITY",
                storageOptions: storageOptions, repo: PricingRepository(container))
            await s.load()
            store = s
        }
    }

    private var header: some View {
        HStack(alignment: .top, spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                Text(i18n.t("pricing.productPrices")).font(.ui(.title)).foregroundStyle(Tokens.text)
                Text(model.label).font(.ui(.body)).foregroundStyle(Tokens.muted)
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

    private func storageCard(_ store: PricingProductModel, _ storage: String) -> some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(storage.isEmpty ? i18n.t("pricing.anyStorage") : storage)
                    .font(.ui(.heading)).foregroundStyle(Tokens.text)
                PricingLevelFields(
                    text: { store.text(storage, $0) },
                    setText: { store.setText(storage, $0, $1) })
            }
        }
    }

    private func saveButton(_ store: PricingProductModel) -> some View {
        Button {
            Task {
                if await store.save() {
                    container.toasts.success(i18n.t("pricing.pricesSaved"))
                    onSaved()
                    dismiss()
                } else if store.error == nil {
                    container.toasts.error(i18n.t("common.error"))
                }
            }
        } label: {
            Text(store.saving ? i18n.t("common.loading") : i18n.t("common.save"))
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillPrimary)
        .disabled(store.saving || !container.connectivity.isOnline)
    }

    /// Storage options for the per-storage rows = the model's `storage`
    /// attribute options (ADR 0013). Empty for a quantity product.
    private var storageOptions: [String] {
        guard model.kindCode != "QUANTITY" else { return [] }
        return model.attributes.first { $0.key.lowercased() == "storage" }?.options ?? []
    }
}
