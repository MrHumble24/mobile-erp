import SwiftUI

/// Customer directory (`customer.read`): the system search bar, filter + new
/// customer + CSV in the toolbar, the summary list-card, then one card per
/// customer. Rows open the detail sheet; create/edit are online-only
/// (`customer.manage`). Title is the tab label (`nav.customers`), the same
/// string as the Android top bar.
struct CustomersView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = CustomersModel()
    @State private var selected: CustomerListItem?
    @State private var showCreate = false
    @State private var showFilters = false

    private var hasActiveFilters: Bool { model.sort != "recent" || model.hasPurchasesOnly }

    var body: some View {
        @Bindable var model = model
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let stats = model.stats { summary(stats) }
                if model.pager != nil { content }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.vertical, Tokens.Space.lg)
        }
        .background(Tokens.ground)
        .searchable(text: $model.search, prompt: i18n.t("customers.searchPlaceholder"))
        .onSubmit(of: .search) { model.reload() }
        .refreshable { model.reload() }
        .navigationTitle(i18n.t("nav.customers"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showFilters = true } label: {
                    Label(i18n.t("common.filter"),
                          systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                }
            }
            if model.canManage {
                ToolbarItem(placement: .primaryAction) {
                    Button { Haptic.tick.play(); showCreate = true } label: {
                        Label(i18n.t("customers.newCustomer"), systemImage: "person.badge.plus")
                    }
                }
            }
            if let items = model.pager?.items, !items.isEmpty {
                ToolbarItem(placement: .secondaryAction) {
                    KitCSVShareButton(filename: "customers.csv", label: i18n.t("customers.exportCsv")) {
                        KitCSV.build(headers: CustomersCsv.headers, rows: CustomersCsv.rows(items))
                    }
                }
            }
        }
        .sheet(isPresented: $showFilters) { CustomerFilterSheet(model: model) }
        .sheet(item: $selected) { customer in CustomerDetailSheet(customer: customer, model: model) }
        .sheet(isPresented: $showCreate) { CustomerFormSheet(model: model) }
        .task {
            model.configure(container)
            if model.pager.items.isEmpty { model.reload() }
        }
        #if DEBUG
        // Screenshot helper: `-openCustomer first` opens the first row's detail.
        .onChange(of: model.pager?.items.count ?? 0) { _, count in
            guard count > 0, selected == nil,
                  KitDebugLaunch.consume("openCustomer") == "first" else { return }
            selected = model.pager?.items.first
        }
        #endif
    }

    private func summary(_ s: CustomerStats) -> some View {
        MetricList(rows: [
            MetricRow(label: i18n.t("customers.statTotal"), value: "\(s.total)"),
            MetricRow(label: i18n.t("customers.statNewThisMonth"), value: "\(s.newThisMonth)"),
            MetricRow(label: i18n.t("customers.statWithPurchases"), value: "\(s.withPurchases)"),
            MetricRow(label: i18n.t("customers.statRepeatBuyers"), value: "\(s.repeatBuyers)"),
        ])
    }

    @ViewBuilder private var content: some View {
        let pager = model.pager!
        if model.offline {
            AppCard { EmptyStateView(systemImage: "wifi.slash", title: i18n.t("common.offline")) }
        } else if pager.isLoading && pager.items.isEmpty {
            AppCard { LoadingView().frame(height: 120) }
        } else if let message = pager.error, pager.items.isEmpty {
            AppCard { ErrorStateView(message: message) { model.reload() } }
        } else if pager.items.isEmpty {
            AppCard { EmptyStateView(systemImage: "person.2", title: i18n.t("customers.empty")) }
        } else {
            ForEach(pager.items) { customer in
                CustomerRow(customer: customer) { selected = customer }
            }
            KitLoadMoreFooter(pager: pager)
        }
    }
}

/// Name + mono phone + purchase count left; total spent (mono) and a warranty
/// pill right.
private struct CustomerRow: View {
    let customer: CustomerListItem
    var onOpen: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(customer.name).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    if let phone = customer.phone {
                        Text(phone).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    }
                    Text(i18n.t("pos.purchaseCount", ["count": String(customer.purchaseCount)]))
                        .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                Spacer(minLength: Tokens.Space.sm)
                VStack(alignment: .trailing, spacing: Tokens.Space.xs) {
                    MoneyText(value: customer.totalSpentString, size: 15).fontWeight(.semibold).foregroundStyle(Tokens.text)
                    if customer.activeWarranties > 0 {
                        StatusBadge(i18n.t("pos.warrantyCount", ["count": String(customer.activeWarranties)]), color: Tokens.success)
                    }
                }
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onOpen)
    }
}
