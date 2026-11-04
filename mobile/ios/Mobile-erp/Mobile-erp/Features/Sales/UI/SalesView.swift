import SwiftUI

/// Sales list: summary card, search (system search bar), filters and warranty
/// lookup in the toolbar, one white card per sale on the warm ground, load more,
/// CSV export. Rows open the detail sheet. Title is the tab label (`nav.sales`),
/// the same string as the Android top bar.
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
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if model.pager != nil { content }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.vertical, Tokens.Space.lg)
        }
        .background(Tokens.ground)
        .searchable(text: $model.filters.search, prompt: i18n.t("sales.filterSearch"))
        .onSubmit(of: .search) { model.reload() }
        .refreshable { model.reload() }
        .navigationTitle(i18n.t("nav.sales"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showFilters = true } label: {
                    Label(
                        i18n.t("common.filter"),
                        systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle"
                    )
                }
            }
            ToolbarItem(placement: .primaryAction) {
                Button { showWarranty = true } label: {
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
        .appSheet(item: $selected) { sale in SaleDetailSheet(sale: sale, onChanged: { model.reload() }) }
        .sheet(isPresented: $showWarranty) { WarrantyLookupSheet(onChanged: { model.reload() }) }
        .task {
            model.configure(container)
            if model.pager.items.isEmpty { model.reload() }
            #if DEBUG
            _ = SalesSelfCheck.ran
            #endif
        }
        #if DEBUG
        // Screenshot helper: `-openSale first` opens the first sale's detail once loaded.
        .onChange(of: model.pager?.items.count ?? 0) { _, count in
            if count > 0, selected == nil, UserDefaults.standard.string(forKey: "openSale") == "first" {
                selected = model.pager?.items.first
            }
        }
        #endif
    }

    @ViewBuilder private var content: some View {
        let pager = model.pager!
        if model.offline {
            AppCard {
                Label(i18n.t("common.offline", default: "Offline"), systemImage: "wifi.slash")
                    .font(.ui(.body))
                    .foregroundStyle(Tokens.warning)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        } else if pager.isLoading && pager.items.isEmpty {
            AppCard { LoadingView().frame(height: 120) }
        } else if let message = pager.error, pager.items.isEmpty {
            AppCard { ErrorStateView(message: message) { model.reload() } }
        } else if pager.items.isEmpty {
            AppCard {
                EmptyStateView(systemImage: "doc.text.magnifyingglass", title: i18n.t("sales.noSalesFound"))
            }
        } else {
            if let stats = model.stats { SalesSummary(stats: stats) }
            ForEach(pager.items) { sale in
                Button { selected = sale } label: { SaleRow(sale: sale) }
                    .buttonStyle(.plain)
            }
            KitLoadMoreFooter(pager: pager)
        }
    }
}

/// One sale card: model, mono IMEI(s), customer · day on the left; mono price
/// and the channel / returned pills on the right — the Android `SaleRow`.
private struct SaleRow: View {
    let sale: SaleView
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(sale.device.model.label)
                        .font(.ui(.bodyStrong))
                        .foregroundStyle(Tokens.text)
                    Text(sale.device.imei)
                        .font(.data(.regular))
                        .foregroundStyle(Tokens.text)
                    if let imei2 = sale.device.imei2, !imei2.isEmpty {
                        Text(imei2).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    }
                    Text("\(sale.customer?.name ?? i18n.t("pos.walkIn")) · \(SaleDate.day(sale.soldAt))")
                        .font(.ui(.caption))
                        .foregroundStyle(Tokens.muted)
                }
                Spacer(minLength: Tokens.Space.sm)
                VStack(alignment: .trailing, spacing: Tokens.Space.xs) {
                    MoneyText(value: sale.salePrice.string, size: 16)
                        .foregroundStyle(Tokens.text)
                    StatusBadge(
                        sale.isB2B ? i18n.t("sales.channelB2B") : i18n.t("sales.channelRetail"),
                        color: sale.isB2B ? Tokens.warning : Tokens.info
                    )
                    if sale.isReturned {
                        StatusBadge(i18n.t("sales.returned"), color: Tokens.danger)
                    }
                }
            }
        }
    }
}
