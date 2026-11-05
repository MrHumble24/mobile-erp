import SwiftUI

/// Customer purchases (Change 14, ADR 0039): phones bought from customers. A
/// date filter, a search by IMEI/serial and the rows; tap for detail. The
/// "Buy a phone" action (owner only, `purchase.create`) opens the buy sheet.
/// Online only — offline shows a note.
struct PurchasesView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = PurchasesListModel()
    @State private var selected: CustomerPurchaseView?
    @State private var showBuy = false
    @State private var showFilter = false

    private var canBuy: Bool { container.session.can("purchase.create") }

    var body: some View {
        @Bindable var model = model
        content
            .background(Tokens.ground)
            .navigationTitle(i18n.t("purchases.title", default: "Customer purchases"))
            .searchable(text: $model.search, prompt: i18n.t("purchases.searchByCode", default: "IMEI / serial"))
            .onSubmit(of: .search) { model.reload() }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showFilter = true } label: {
                        Image(systemName: model.hasFilter ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                    }
                }
                if canBuy {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button { showBuy = true } label: { Image(systemName: "plus") }
                    }
                }
            }
            .appSheet(isPresented: $showBuy) { BuyPhoneSheet { model.reload() } }
            .appSheet(item: $selected) { PurchaseDetailSheet(purchaseId: $0.id) }
            .sheet(isPresented: $showFilter) { filterSheet }
            .task {
                model.configure(container)
                if model.items.isEmpty { model.reload() }
                #if DEBUG
                if canBuy, KitDebugLaunch.consume("openBuyPhone") != nil { showBuy = true }
                #endif
            }
            .refreshable { model.reload() }
    }

    @ViewBuilder private var content: some View {
        if model.offline {
            EmptyStateView(systemImage: "wifi.slash", title: i18n.t("common.offline"),
                           message: i18n.t("purchases.tradeInOffline", default: "Available online only"))
        } else if model.loading && model.items.isEmpty {
            LoadingView()
        } else if let error = model.error, model.items.isEmpty {
            ErrorStateView(message: error) { model.reload() }
        } else if model.items.isEmpty {
            EmptyStateView(systemImage: "arrow.down.circle", title: i18n.t("purchases.empty", default: "No purchases yet"))
        } else {
            ScrollView {
                VStack(spacing: Tokens.Space.md) {
                    ForEach(model.items) { purchase in
                        Button { selected = purchase } label: { PurchaseRow(purchase: purchase) }
                            .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.md)
            }
        }
    }

    private var filterSheet: some View {
        @Bindable var model = model
        return FilterSheet(
            title: i18n.t("reports.period", default: "Period"),
            resetLabel: i18n.t("inventory.clearFilters", default: "Clear"),
            closeLabel: i18n.t("common.close"),
            onReset: { model.from = nil; model.to = nil; model.reload(); showFilter = false },
            onClose: { model.reload(); showFilter = false }
        ) {
            AppFormField(label: i18n.t("reports.dateFrom", default: "From")) {
                AppDateField(date: Binding(get: { model.from ?? Date() }, set: { model.from = $0 }))
            }
            AppFormField(label: i18n.t("reports.dateTo", default: "To")) {
                AppDateField(date: Binding(get: { model.to ?? Date() }, set: { model.to = $0 }))
            }
        }
    }
}

/// One purchase row: seller + date, the code and model, the price paid (when the
/// server sends it). A trade-in is tagged.
private struct PurchaseRow: View {
    let purchase: CustomerPurchaseView
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(purchase.customer.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                    Text(purchase.unit.model.label).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    Text(purchase.unit.code).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    HStack(spacing: Tokens.Space.sm) {
                        Text(KitDate.day(purchase.occurredAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                        if purchase.isTradeIn {
                            StatusBadge(i18n.t("purchases.tradeInLabel", default: "Trade-in"), color: Tokens.info)
                        }
                    }
                }
                Spacer(minLength: Tokens.Space.sm)
                if let price = purchase.pricePaid {
                    MoneyText(value: price, size: 16).fontWeight(.semibold).foregroundStyle(Tokens.text)
                }
            }
        }
    }
}
