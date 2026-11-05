import SwiftUI

/// Stock by quantity (ADR 0030): one white card per counted product on the warm
/// ground, with a category filter and a name/barcode/model-code search. A card
/// opens the product's movements (and, with `stock.adjust`, the write-off and
/// count-correction sheets). Online-only.
struct StockView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = StockListModel()
    @State private var selected: StockLevel?

    var body: some View {
        @Bindable var model = model
        ScrollView {
            VStack(spacing: Tokens.Space.lg) { content }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.lg)
        }
        .background(Tokens.ground)
        .searchable(text: $model.search, prompt: i18n.t("catalog.scanCode"))
        .onSubmit(of: .search) { model.reload() }
        .refreshable { model.reload() }
        .navigationTitle(i18n.t("catalog.stockTitle"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) { categoryMenu }
        }
        .appSheet(item: $selected, onDismiss: { model.reload() }) { level in
            StockMovementsSheet(level: level, canAdjust: model.canAdjust, canViewCost: model.canViewCost)
        }
        .task {
            model.configure(container)
            model.loadCategories()
            if model.items.isEmpty { model.reload() }
            #if DEBUG
            _ = StockSelfCheck.ran
            // `-openStockMovements first` opens the first product's movements once
            // loaded (adjust sheets then via `-openStockAdjust`).
            #endif
        }
        #if DEBUG
        .onChange(of: model.items.count) { _, count in
            guard count > 0 else { return }
            if KitDebugLaunch.consume("openStockMovements") == "first", selected == nil {
                selected = model.items.first
            }
        }
        #endif
    }

    @ViewBuilder private var content: some View {
        if !model.online {
            AppCard {
                Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                    .font(.ui(.body)).foregroundStyle(Tokens.warning)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        } else if model.loading && model.items.isEmpty {
            AppCard { LoadingView().frame(height: 120) }
        } else if let message = model.error, model.items.isEmpty {
            AppCard { ErrorStateView(message: message) { model.reload() } }
        } else if model.items.isEmpty {
            AppCard { EmptyStateView(systemImage: "shippingbox", title: i18n.t("catalog.stockEmpty")) }
        } else {
            if let value = model.totalValue {
                AppCard {
                    HStack {
                        Text(i18n.t("catalog.stockValue")).font(.ui(.body)).foregroundStyle(Tokens.muted)
                        Spacer()
                        MoneyText(value: value, size: 18).foregroundStyle(Tokens.text)
                    }
                }
            }
            ForEach(model.items) { level in
                Button { selected = level } label: {
                    StockRow(level: level, canViewCost: model.canViewCost)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var categoryMenu: some View {
        Menu {
            Picker(i18n.t("catalog.category"), selection: Binding(
                get: { model.categoryId },
                set: { model.categoryId = $0; model.reload() }
            )) {
                Text(i18n.t("catalog.allCategories")).tag(String?.none)
                ForEach(model.categories) { c in Text(c.name).tag(String?.some(c.id)) }
            }
        } label: {
            Label(i18n.t("catalog.category"),
                  systemImage: model.categoryId != nil ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
        }
    }
}
