import SwiftUI

/// Customer directory: searchable, paginated list with sort + "has purchases"
/// filter, summary tiles, CSV export and a create action (gated on
/// `customer.manage`). Rows open a detail sheet.
struct CustomersView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = CustomersModel()
    @State private var selected: CustomerListItem?
    @State private var showCreate = false

    var body: some View {
        @Bindable var model = model
        List {
            if model.pager != nil {
                Section {
                    Picker(i18n.t("common.filter"), selection: $model.sort) {
                        Text(i18n.t("common.date")).tag("recent")
                        Text(i18n.t("common.name")).tag("name")
                    }
                    .onChange(of: model.sort) { _, _ in model.reload() }
                    Toggle(i18n.t("sales.customerSalesHistory"), isOn: $model.hasPurchasesOnly)
                        .onChange(of: model.hasPurchasesOnly) { _, _ in model.reload() }
                }
                if let stats = model.stats {
                    Section { CustomersSummary(stats: stats) }
                        .listRowInsets(EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12))
                }
                content
            }
        }
        .searchable(text: $model.search)
        .onSubmit(of: .search) { model.reload() }
        .refreshable { model.reload() }
        .navigationTitle(i18n.t("sales.customersTitle"))
        .toolbar {
            if model.canManage {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showCreate = true
                    } label: {
                        Label(i18n.t("sales.newCustomer"), systemImage: "plus")
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
        .sheet(item: $selected) { customer in CustomerDetailSheet(customer: customer, model: model) }
        .sheet(isPresented: $showCreate) { CustomerFormSheet(model: model) }
        .task {
            model.configure(container)
            if model.pager.items.isEmpty { model.reload() }
        }
    }

    @ViewBuilder private var content: some View {
        let pager = model.pager!
        if model.offline {
            Section {
                Label(i18n.t("common.offline", default: "Offline — customers need a connection."),
                      systemImage: "wifi.slash")
                    .foregroundStyle(Tokens.warning)
            }
        } else if pager.isLoading && pager.items.isEmpty {
            Section { LoadingView().frame(height: 120) }
        } else if let message = pager.error, pager.items.isEmpty {
            Section { ErrorStateView(message: message) { model.reload() } }
        } else if pager.items.isEmpty {
            Section {
                EmptyStateView(systemImage: "person.2",
                               title: i18n.t("sales.noCustomersFound"))
            }
        } else {
            Section {
                ForEach(pager.items) { customer in
                    Button { selected = customer } label: { CustomerRow(customer: customer) }
                        .buttonStyle(.plain)
                }
                KitLoadMoreFooter(pager: pager)
            }
        }
    }
}

private struct CustomerRow: View {
    let customer: CustomerListItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(customer.name).font(.body.weight(.medium))
                Spacer()
                MoneyText(value: customer.totalSpentString)
            }
            HStack(spacing: 8) {
                if let phone = customer.phone {
                    Text(phone).font(.mono(12)).foregroundStyle(.secondary)
                }
                Spacer()
                Text(i18n.t("pos.purchaseCount", ["count": String(customer.purchaseCount)]))
                    .font(.caption).foregroundStyle(.secondary)
                if customer.activeWarranties > 0 {
                    StatusBadge(i18n.t("pos.warrantyCount", ["count": String(customer.activeWarranties)]),
                                color: Tokens.success)
                }
            }
        }
        .padding(.vertical, 2)
    }
}
