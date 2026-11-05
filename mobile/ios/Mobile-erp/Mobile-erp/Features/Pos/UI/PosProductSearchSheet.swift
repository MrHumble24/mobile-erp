import SwiftUI

/// Find a quantity product by name/barcode/model code (`GET /stock?search=`) and
/// add it to the cart (ADR 0030). Online-only — the scan field already handles
/// cached barcodes offline. Tapping a result adds it (quantity 1) and closes.
struct PosProductSearchSheet: View {
    let onAdd: (PosCartProduct) -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var query = ""
    @State private var results: [StockLevel] = []
    @State private var loading = false

    var body: some View {
        NavigationStack {
            List {
                if loading {
                    LoadingView().listRowBackground(Color.clear)
                } else if results.isEmpty {
                    Text(i18n.t("catalog.stockEmpty")).foregroundStyle(Tokens.muted)
                } else {
                    ForEach(results) { level in
                        Button { add(level) } label: { row(level) }
                            .buttonStyle(.plain)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .listRowBackground(Tokens.surface)
            .background(Tokens.bg)
            .searchable(text: $query, prompt: i18n.t("catalog.scanCode"))
            .onSubmit(of: .search, search)
            .navigationTitle(i18n.t("catalog.addToCart"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.close", default: "Close")) { dismiss() }
                }
            }
            .task { search() }
        }
    }

    private func row(_ level: StockLevel) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(level.label).font(.ui(.body)).foregroundStyle(Tokens.text)
                Text(i18n.t("catalog.pieces", ["count": String(level.quantity)]))
                    .font(.data(.regular))
                    .foregroundStyle(level.isBelowZero ? Tokens.danger : Tokens.muted)
            }
            Spacer()
            if let price = level.salePrice { MoneyText(value: price, size: 14) }
        }
    }

    private func add(_ level: StockLevel) {
        onAdd(PosCartProduct(modelId: level.modelId, name: level.label, barcode: level.barcode,
                             salePrice: level.salePrice, quantityInStock: level.quantity))
        dismiss()
    }

    private func search() {
        loading = true
        let repo = StockRepository(api: container.api)
        let q = query
        Task {
            results = (try? await repo.list(categoryId: nil, search: q)) ?? []
            loading = false
        }
    }
}
