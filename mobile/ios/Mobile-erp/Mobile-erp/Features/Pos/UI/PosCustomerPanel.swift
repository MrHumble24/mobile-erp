import SwiftUI

/// Cart customer: attach an existing one via typeahead, add an inline new one,
/// or leave it a walk-in. Writes to `cart.customer` (an existing id and an
/// inline name are mutually exclusive).
struct PosCustomerPanel: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n
    @State private var showSearch = false
    @State private var addNew = false

    private var cart: PosCart { model.cart }

    var body: some View {
        Section(i18n.t("pos.customer")) {
            if let customer = cart.customer {
                LabeledContent(customer.name) {
                    Button(i18n.t("common.clear", default: "Clear"), role: .destructive) {
                        cart.customer = nil
                        addNew = false
                    }
                    .font(.subheadline)
                }
                if let phone = customer.phone, !phone.isEmpty {
                    Text(phone).font(.mono(13)).foregroundStyle(.secondary)
                }
            } else {
                Button {
                    model.searchCustomers("")
                    showSearch = true
                } label: {
                    Label(i18n.t("pos.searchCustomer"), systemImage: "magnifyingglass")
                }
                Toggle(i18n.t("pos.newCustomer"), isOn: $addNew.animation())
                if addNew { newCustomerFields }
            }
        }
        .sheet(isPresented: $showSearch) {
            PosCustomerSearchSheet(model: model) { hit in
                cart.customer = PosCartCustomer(id: hit.id, name: hit.name, phone: hit.phone)
                showSearch = false
            }
        }
    }

    @ViewBuilder private var newCustomerFields: some View {
        TextField(i18n.t("pos.customerName"), text: Binding(
            get: { cart.customer?.name ?? "" },
            set: { cart.customer = PosCartCustomer(id: nil, name: $0, phone: cart.customer?.phone) }))
        TextField(i18n.t("pos.customerPhone"), text: customerPhoneBinding)
            .keyboardType(.phonePad)
            .sanitizePhone(customerPhoneBinding)
    }

    private var customerPhoneBinding: Binding<String> {
        Binding(
            get: { cart.customer?.phone ?? "" },
            set: { cart.customer = PosCartCustomer(id: nil, name: cart.customer?.name ?? "", phone: $0.sanitizedPhone) }
        )
    }
}

/// Debounced typeahead sheet over `/customers/lookup`. Selecting a hit hands it
/// back to the panel to attach.
private struct PosCustomerSearchSheet: View {
    let model: PosViewModel
    let onSelect: (PosCustomerHit) -> Void
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    var body: some View {
        NavigationStack {
            List {
                if model.customerHits.isEmpty {
                    Text(i18n.t("common.notFound")).foregroundStyle(.secondary)
                }
                ForEach(model.customerHits) { hit in
                    Button { onSelect(hit) } label: {
                        HStack {
                            Text(hit.name)
                            Spacer()
                            if let phone = hit.phone {
                                Text(phone).font(.mono(12)).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .searchable(text: $query)
            .onChange(of: query) { _, q in model.searchCustomers(q) }
            .navigationTitle(i18n.t("pos.searchCustomer"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
