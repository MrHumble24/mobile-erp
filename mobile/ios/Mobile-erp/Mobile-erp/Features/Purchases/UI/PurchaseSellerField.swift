import SwiftUI

/// A hit from `GET /customers/lookup` (slice-local minimal decode).
struct PurchaseCustomerHit: Decodable, Identifiable {
    let id: String
    let name: String
    let phone: String?
}

/// Pick the seller on a buy: attach an existing customer by typeahead, or type a
/// new one's name + phone. Writes to a `PurchaseSeller` binding (an existing id
/// and an inline name are mutually exclusive). No passport / ID field — ever.
struct PurchaseSellerField: View {
    @Binding var seller: PurchaseSeller
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var showSearch = false
    @State private var addNew = false

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            if let id = seller.id, !id.isEmpty {
                attached
            } else {
                Button { showSearch = true } label: {
                    Label(i18n.t("purchases.searchCustomer", default: "Search a customer"),
                          systemImage: "magnifyingglass").frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillSecondary)
                Toggle(i18n.t("purchases.newCustomer", default: "New seller"), isOn: $addNew.animation())
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                if addNew { newFields }
            }
        }
        .sheet(isPresented: $showSearch) {
            PurchaseSellerSearchSheet { hit in
                seller = PurchaseSeller(id: hit.id, name: hit.name, phone: hit.phone)
                addNew = false
                showSearch = false
            }
        }
    }

    private var attached: some View {
        HStack {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                Text(seller.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                if let phone = seller.phone, !phone.isEmpty {
                    Text(phone).font(.data(.regular)).foregroundStyle(Tokens.muted)
                }
            }
            Spacer()
            Button(i18n.t("common.clear", default: "Clear"), role: .destructive) {
                seller = PurchaseSeller()
            }
            .buttonStyle(.pillGhost)
        }
    }

    @ViewBuilder private var newFields: some View {
        AppTextField(placeholder: i18n.t("purchases.sellerName", default: "Seller name"),
                     text: Binding(get: { seller.name }, set: { seller = PurchaseSeller(id: nil, name: $0, phone: seller.phone) }))
        AppTextField(placeholder: i18n.t("purchases.sellerPhone", default: "Phone (optional)"),
                     text: phoneBinding, keyboard: .phonePad)
            .sanitizePhone(phoneBinding)
    }

    private var phoneBinding: Binding<String> {
        Binding(get: { seller.phone ?? "" },
                set: { seller = PurchaseSeller(id: nil, name: seller.name, phone: $0.sanitizedPhone) })
    }
}

/// Debounced typeahead over `/customers/lookup`. Selecting a hit hands it back.
private struct PurchaseSellerSearchSheet: View {
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
            .navigationTitle(i18n.t("purchases.searchCustomer", default: "Search a customer"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
            }
            .task { search("") }
        }
        .presentationDetents([.medium, .large])
    }

    private func search(_ q: String) {
        Task {
            hits = (try? await container.api.get("/customers/lookup", query: ["q": q])) ?? []
        }
    }
}
