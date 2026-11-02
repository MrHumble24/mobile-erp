import SwiftUI

/// Sales list with channel/status/date filters and search, plus a warranty
/// lookup reachable from the toolbar (works offline). Rows open a detail sheet.
struct SalesView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = SalesListModel()
    @State private var selected: SaleView?
    @State private var showWarranty = false
    @State private var showFilters = false

    private var hasActiveFilters: Bool {
        model.filters.channel != nil || model.filters.returned != nil || model.filters.from != nil || model.filters.to != nil
    }

    var body: some View {
        @Bindable var model = model
        List {
            content
        }
        .searchable(text: $model.filters.search)
        .onSubmit(of: .search) { model.reload() }
        .refreshable { model.reload() }
        .navigationTitle(i18n.t("sales.title"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
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
        }
        .sheet(isPresented: $showFilters) { SalesFilterSheet(model: model) }
        .sheet(item: $selected) { sale in SaleDetailSheet(sale: sale, onChanged: { model.reload() }) }
        .sheet(isPresented: $showWarranty) { WarrantyLookupSheet(onChanged: { model.reload() }) }
        .task {
            model.configure(container)
            if model.page == nil { model.reload() }
            #if DEBUG
            _ = SalesSelfCheck.ran
            #endif
        }
    }

    @ViewBuilder private var content: some View {
        if model.offline {
            Section {
                Label(i18n.t("common.offline", default: "Offline — sales need a connection."),
                      systemImage: "wifi.slash")
                    .foregroundStyle(Tokens.warning)
            }
        } else if model.loading && model.page == nil {
            Section { LoadingView().frame(height: 120) }
        } else if let message = model.errorMessage {
            Section { ErrorStateView(message: message) { model.reload() } }
        } else if let page = model.page, page.items.isEmpty {
            Section {
                EmptyStateView(systemImage: "doc.text.magnifyingglass",
                               title: i18n.t("sales.noSalesFound"))
            }
        } else if let page = model.page {
            Section {
                ForEach(page.items) { sale in
                    Button { selected = sale } label: { SaleRow(sale: sale) }
                        .buttonStyle(.plain)
                }
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
                        .foregroundStyle(.secondary)
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
                    .foregroundStyle(.secondary)
                Spacer()
                Text(SaleDate.day(sale.soldAt))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
