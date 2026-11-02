import SwiftUI

/// Partner directory screen (`partner.read`): offline-aware list with balances,
/// search / status / overdue filters, summary tiles, and a tap-through detail
/// sheet. New-partner is gated on `partner.manage`.
struct PartnersView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var model: PartnersListModel?
    @State private var detail: Partner?
    @State private var showCreate = false

    var body: some View {
        content
            .navigationTitle(i18n.t("partners.title"))
            .toolbar { toolbar }
            .task { if model == nil { let m = container.makePartnersListModel(); model = m; await m.load() } }
            .sheet(isPresented: $showCreate) {
                PartnerFormSheet(mode: .create) { Task { await model?.load() } }
            }
            .sheet(item: $detail) { partner in
                PartnerDetailView(partner: partner) { Task { await model?.load() } }
            }
    }

    @ViewBuilder private var content: some View {
        if let model {
            List {
                Section {
                    PartnersFilterBar(model: model)
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                        .listRowBackground(Color.clear)
                }
                if model.offline {
                    Label(i18n.t("common.offline", default: "Offline — showing cached balances"),
                          systemImage: "wifi.slash")
                        .font(.caption)
                        .foregroundStyle(Tokens.warning)
                        .listRowBackground(Color.clear)
                }
                Section { PartnersSummary(model: model) }
                    .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                    .listRowBackground(Color.clear)
                listBody(model)
            }
            .listStyle(.plain)
            .refreshable { await model.load() }
            .overlay { if model.isLoading && model.partners.isEmpty { LoadingView() } }
        } else {
            LoadingView()
        }
    }

    @ViewBuilder private func listBody(_ model: PartnersListModel) -> some View {
        if model.filtered.isEmpty && !model.isLoading {
            EmptyStateView(systemImage: "person.2",
                           title: i18n.t("partners.noPartnersFound"))
                .listRowBackground(Color.clear)
        } else {
            Section {
                ForEach(model.filtered) { partner in
                    Button { detail = partner } label: { PartnerListRow(partner: partner) }
                        .buttonStyle(.plain)
                }
            }
        }
    }

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        if container.session.can("partner.manage") {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCreate = true } label: {
                    Label(i18n.t("partners.newPartner"), systemImage: "plus")
                }
            }
        }
    }
}
