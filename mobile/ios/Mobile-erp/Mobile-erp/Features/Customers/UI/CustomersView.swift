import SwiftUI

/// Customer directory: searchable list with sort + "has purchases" filter and a
/// create action (gated on `customer.manage`). Rows open a detail sheet.
struct CustomersView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = CustomersModel()
    @State private var selected: CustomerListItem?
    @State private var showCreate = false
    @State private var showFilters = false

    private var hasActiveFilters: Bool {
        model.sort != "recent" || model.hasPurchasesOnly
    }

    var body: some View {
        @Bindable var model = model
        List {
            content
        }
        .searchable(text: $model.search)
        .onSubmit(of: .search) { model.reload() }
        .refreshable { model.reload() }
        .navigationTitle(i18n.t("sales.customersTitle"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    showFilters = true
                } label: {
                    Label(
                        i18n.t("common.filter", default: "Filters"),
                        systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle"
                    )
                }
            }
            if model.canManage {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showCreate = true
                    } label: {
                        Label(i18n.t("sales.newCustomer"), systemImage: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showFilters) { CustomerFilterSheet(model: model) }
        .sheet(item: $selected) { customer in CustomerDetailSheet(customer: customer, model: model) }
        .sheet(isPresented: $showCreate) { CustomerFormSheet(model: model) }
        .task {
            model.configure(container)
            if model.page == nil { model.reload() }
        }
    }

    @ViewBuilder private var content: some View {
        if model.offline {
            Section {
                Label(i18n.t("common.offline", default: "Offline — customers need a connection."),
                      systemImage: "wifi.slash")
                    .foregroundStyle(Tokens.warning)
            }
        } else if model.loading && model.page == nil {
            Section { LoadingView().frame(height: 120) }
        } else if let message = model.errorMessage {
            Section { ErrorStateView(message: message) { model.reload() } }
        } else if let page = model.page, page.items.isEmpty {
            Section {
                EmptyStateView(systemImage: "person.2",
                               title: i18n.t("sales.noCustomersFound"))
            }
        } else if let page = model.page {
            Section {
                ForEach(page.items) { customer in
                    Button { selected = customer } label: { CustomerRow(customer: customer) }
                        .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct CustomerRow: View {
    let customer: CustomerListItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(customer.name)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Tokens.ink)
                    if let phone = customer.phone {
                        Text(phone)
                            .font(.mono(12))
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                MoneyText(value: customer.totalSpentString, size: 16)
                    .foregroundStyle(Tokens.ink)
            }
            HStack(spacing: 8) {
                Text(i18n.t("pos.purchaseCount", ["count": String(customer.purchaseCount)]))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                if customer.activeWarranties > 0 {
                    StatusBadge(i18n.t("pos.warrantyCount", ["count": String(customer.activeWarranties)]),
                                color: Tokens.success)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
