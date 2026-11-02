import SwiftUI

/// Customer detail: profile + purchase aggregates, and the purchase history
/// (`GET /customers/:id/sales`, online).
struct CustomerDetailSheet: View {
    let customer: CustomerListItem
    let model: CustomersModel
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var sales: [CustomerSale]?
    @State private var error: String?
    @State private var showEdit = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LabeledContent(i18n.t("common.name"), value: customer.name)
                    if let phone = customer.phone {
                        LabeledContent(i18n.t("common.phone"), value: phone)
                    }
                    if let notes = customer.notes, !notes.isEmpty {
                        LabeledContent(i18n.t("common.notes"), value: notes)
                    }
                }
                Section {
                    LabeledContent(i18n.t("pos.lineCount"), value: String(customer.purchaseCount))
                    LabeledContent(i18n.t("sales.statsRevenue")) {
                        MoneyText(value: customer.totalSpentString)
                    }
                    LabeledContent(i18n.t("sales.warranty"), value: String(customer.activeWarranties))
                    LabeledContent(i18n.t("sales.returned"), value: String(customer.returnsCount))
                }
                Section(i18n.t("sales.customerSalesHistory")) { history }
            }
            .navigationTitle(customer.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
                if model.canManage {
                    ToolbarItem(placement: .primaryAction) {
                        Button(i18n.t("common.edit", default: "Edit")) { showEdit = true }
                    }
                }
            }
            .sheet(isPresented: $showEdit) {
                CustomerFormSheet(model: model, editing: customer)
            }
            .task { if sales == nil { load() } }
        }
    }

    @ViewBuilder private var history: some View {
        if let sales {
            if sales.isEmpty {
                Text(i18n.t("sales.noSalesFound")).foregroundStyle(.secondary)
            } else {
                ForEach(sales) { sale in
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(sale.modelLabel).font(.body.weight(.medium))
                            Spacer()
                            MoneyText(value: sale.salePrice)
                        }
                        Text(sale.device.imei).font(.mono(12)).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 2)
                }
            }
        } else if let error {
            Text(error).foregroundStyle(Tokens.destructive).font(.footnote)
        } else {
            ProgressView()
        }
    }

    private func load() {
        guard container.connectivity.isOnline else {
            error = i18n.t("common.offline", default: "Offline — history needs a connection.")
            return
        }
        error = nil
        let repo = CustomersRepository(api: container.api)
        Task {
            do { sales = try await repo.sales(customer.id) }
            catch let e as AppError { error = e.message }
            catch { self.error = error.localizedDescription }
        }
    }
}
