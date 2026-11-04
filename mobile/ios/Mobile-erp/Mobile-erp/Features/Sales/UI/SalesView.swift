import SwiftUI

/// Sales list with channel/status/warranty/cashier filters, a date range, search
/// and summary tiles. Paginated (load more) with CSV export, plus a warranty
/// lookup reachable from the toolbar (works offline). Rows open a detail sheet.
struct SalesView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = SalesListModel()
    @State private var selected: SaleView?
    @State private var showWarranty = false
    @State private var showFilters = false

    private var hasActiveFilters: Bool { model.filters.isActive }

    var body: some View {
        @Bindable var model = model
        List {
            if model.pager != nil {
                content
            }
        }
        .searchable(text: $model.filters.search)
        .onSubmit(of: .search) { model.reload() }
        .refreshable { model.reload() }
        .navigationTitle(i18n.t("sales.title"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Haptic.tick.play()
                    showFilters = true
                } label: {
                    Label(
                        i18n.t("common.filter", default: "Filter"),
                        systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle"
                    )
                }
            }
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showWarranty = true
                } label: {
                    Label(i18n.t("sales.tabWarranty"), systemImage: "checkmark.shield")
                }
            }
            if let items = model.pager?.items, !items.isEmpty {
                ToolbarItem(placement: .secondaryAction) {
                    KitCSVShareButton(filename: "sales.csv", label: i18n.t("sales.exportCsv")) {
                        KitCSV.build(headers: SalesCsv.headers(includeProfit: model.canViewProfit),
                                     rows: SalesCsv.rows(items, includeProfit: model.canViewProfit))
                    }
                }
            }
        }
        .sheet(isPresented: $showFilters) { SalesFilterSheet(model: model) }
        .sheet(item: $selected) { sale in SaleDetailSheet(sale: sale, onChanged: { model.reload() }) }
        .sheet(isPresented: $showWarranty) { WarrantyLookupSheet(onChanged: { model.reload() }) }
        .task {
            model.configure(container)
            if model.pager.items.isEmpty { model.reload() }
            #if DEBUG
            _ = SalesSelfCheck.ran
            #endif
        }
    }

    @ViewBuilder private var content: some View {
        let pager = model.pager!
        if model.offline {
            Section {
                Label(i18n.t("common.offline", default: "Offline — sales need a connection."),
                      systemImage: "wifi.slash")
                    .foregroundStyle(Tokens.warning)
            }
        } else if pager.isLoading && pager.items.isEmpty {
            Section { LoadingView().frame(height: 120) }
        } else if let message = pager.error, pager.items.isEmpty {
            Section { ErrorStateView(message: message) { model.reload() } }
        } else if pager.items.isEmpty {
            Section {
                EmptyStateView(systemImage: "doc.text.magnifyingglass",
                               title: i18n.t("sales.noSalesFound"))
            }
        } else {
            Section {
                ForEach(pager.items) { sale in
                    Button { selected = sale } label: { SaleRow(sale: sale) }
                        .buttonStyle(.plain)
                }
                KitLoadMoreFooter(pager: pager)
            }
        }
    }
}

/// One sale row: device + IMEI, customer, price, date, channel badge.
private struct SaleRow: View {
    let sale: SaleView
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(sale.device.model.label)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Tokens.ink)
                    Text(sale.device.imei)
                        .font(.mono(12))
                        .foregroundStyle(Tokens.muted)
                }
                Spacer()
                MoneyText(value: sale.salePrice.string, size: 16)
                    .foregroundStyle(Tokens.ink)
            }
            HStack(spacing: 8) {
                StatusBadge(
                    sale.isB2B ? i18n.t("sales.channelB2B") : i18n.t("sales.channelRetail"),
                    color: sale.isB2B ? Tokens.warning : Tokens.signalBlue
                )
                Text(sale.customer?.name ?? i18n.t("pos.walkIn"))
                    .font(.caption)
                    .foregroundStyle(Tokens.muted)
                Spacer()
                Text(SaleDate.day(sale.soldAt))
                    .font(.caption)
                    .foregroundStyle(Tokens.muted)
            }
        }
        .padding(.vertical, 4)
    }
}
