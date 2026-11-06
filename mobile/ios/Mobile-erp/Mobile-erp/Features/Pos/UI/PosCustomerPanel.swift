import SwiftUI

/// Cart customer card: attach an existing one via typeahead, add an inline new
/// one, or leave it a walk-in. Writes to `cart.customer` (an existing id and an
/// inline name are mutually exclusive).
struct PosCustomerPanel: View {
    let model: PosViewModel
    @Environment(I18n.self) private var i18n
    @State private var showSearch = false
    @State private var addNew = false

    private var cart: PosCart { model.cart }

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                Text(i18n.t("pos.customer"))
                    .font(.ui(.heading))
                    .foregroundStyle(Tokens.text)
                levelControl
                if let customer = cart.customer {
                    attached(customer)
                } else {
                    Button {
                        model.searchCustomers("")
                        showSearch = true
                    } label: {
                        Label(i18n.t("pos.searchCustomer"), systemImage: "magnifyingglass")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.pillSecondary)
                    Toggle(i18n.t("pos.newCustomer"), isOn: $addNew.animation())
                        .font(.ui(.body))
                    if addNew { newCustomerFields }
                }
            }
        }
        .sheet(isPresented: $showSearch) {
            PosCustomerSearchSheet(model: model) { hit in
                model.attachCustomer(hit)
                showSearch = false
            }
        }
    }

    /// The price-level control: follows the chosen customer, the seller may
    /// switch it, and changing it re-prices every line (ADR 0034).
    private var levelControl: some View {
        AppFormField(label: i18n.t("pricing.priceLevel")) {
            SegmentedControl(
                selection: Binding(get: { cart.level }, set: { cart.setLevel($0) }),
                segments: PriceLevels.all.map { ($0, i18n.t(PriceLevels.labelKey($0))) })
        }
    }

    private func attached(_ customer: PosCartCustomer) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                Text(customer.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                if let phone = customer.phone, !phone.isEmpty {
                    Text(phone).font(.data(.regular)).foregroundStyle(Tokens.muted)
                }
            }
            Spacer()
            Button(i18n.t("common.clear", default: "Clear"), role: .destructive) {
                cart.detachCustomer()
                cart.setLevel(PriceLevels.defaultCode)
                model.clearBonus()
                addNew = false
            }
            .buttonStyle(.pillGhost)
        }
    }

    @ViewBuilder private var newCustomerFields: some View {
        AppTextField(placeholder: i18n.t("pos.customerName"), text: Binding(
            get: { cart.customer?.name ?? "" },
            set: {
                model.clearBonus()
                cart.customer = PosCartCustomer(id: nil, name: $0, phone: cart.customer?.phone)
            }))
        AppTextField(placeholder: i18n.t("pos.customerPhone"), text: customerPhoneBinding, keyboard: .phonePad)
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
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    var body: some View {
        NavigationStack {
            List {
                if model.customerHits.isEmpty {
                    Text(i18n.t("common.notFound")).foregroundStyle(Tokens.muted)
                }
                ForEach(model.customerHits) { hit in
                    Button { onSelect(hit) } label: {
                        HStack {
                            Text(hit.name)
                            if container.storeFlags.bonusEnabled, let bonus = hit.bonusBalance {
                                Text(i18n.t("customers.bonusPickerPoints", ["points": BonusText.format(bonus)]))
                                    .font(.ui(.caption))
                                    .foregroundStyle(Tokens.muted)
                            }
                            Spacer()
                            if let phone = hit.phone {
                                Text(phone).font(.mono(12)).foregroundStyle(Tokens.muted)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Tokens.ground)
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
