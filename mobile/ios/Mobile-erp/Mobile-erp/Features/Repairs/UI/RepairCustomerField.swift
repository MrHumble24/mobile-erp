import SwiftUI

/// Pick the repair's customer: attach an existing one by typeahead, or type a
/// new name + phone. Writes to a `RepairCustomer` binding. No passport / ID.
struct RepairCustomerField: View {
    @Binding var customer: RepairCustomer
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var showSearch = false
    @State private var addNew = false

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            if let id = customer.id, !id.isEmpty {
                attached
            } else {
                Button { showSearch = true } label: {
                    Label(i18n.t("repairs.searchCustomer", default: "Search a customer"),
                          systemImage: "magnifyingglass").frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillSecondary)
                Toggle(i18n.t("repairs.newCustomer", default: "New customer"), isOn: $addNew.animation())
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                if addNew { newFields }
            }
        }
        .sheet(isPresented: $showSearch) {
            RepairCustomerSearchSheet { hit in
                customer = RepairCustomer(id: hit.id, name: hit.name, phone: hit.phone)
                addNew = false
                showSearch = false
            }
        }
    }

    private var attached: some View {
        HStack {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                Text(customer.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                if let phone = customer.phone, !phone.isEmpty {
                    Text(phone).font(.data(.regular)).foregroundStyle(Tokens.muted)
                }
            }
            Spacer()
            Button(i18n.t("common.clear", default: "Clear"), role: .destructive) {
                customer = RepairCustomer()
            }
            .buttonStyle(.pillGhost)
        }
    }

    @ViewBuilder private var newFields: some View {
        AppTextField(placeholder: i18n.t("repairs.customerName", default: "Customer name"),
                     text: Binding(get: { customer.name }, set: { customer = RepairCustomer(id: nil, name: $0, phone: customer.phone) }))
        AppTextField(placeholder: i18n.t("repairs.customerPhone", default: "Phone"),
                     text: phoneBinding, keyboard: .phonePad)
            .sanitizePhone(phoneBinding)
    }

    private var phoneBinding: Binding<String> {
        Binding(get: { customer.phone ?? "" },
                set: { customer = RepairCustomer(id: nil, name: customer.name, phone: $0.sanitizedPhone) })
    }
}

/// Debounced typeahead over `/customers/lookup` (reuses `PurchaseCustomerHit`).
private struct RepairCustomerSearchSheet: View {
    let onSelect: (PurchaseCustomerHit) -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @State private var hits: [PurchaseCustomerHit] = []

    var body: some View {
        NavigationStack {
            List {
                if hits.isEmpty { Text(i18n.t("common.notFound")).foregroundStyle(Tokens.muted) }
                ForEach(hits) { hit in
                    Button { onSelect(hit) } label: {
                        HStack {
                            Text(hit.name)
                            Spacer()
                            if let phone = hit.phone { Text(phone).font(.mono(12)).foregroundStyle(Tokens.muted) }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Tokens.ground)
            .searchable(text: $query)
            .onChange(of: query) { _, q in search(q) }
            .navigationTitle(i18n.t("repairs.searchCustomer", default: "Search a customer"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(i18n.t("common.cancel")) { dismiss() } }
            }
            .task { search("") }
        }
        .presentationDetents([.medium, .large])
    }

    private func search(_ q: String) {
        Task { hits = (try? await container.api.get("/customers/lookup", query: ["q": q])) ?? [] }
    }
}
