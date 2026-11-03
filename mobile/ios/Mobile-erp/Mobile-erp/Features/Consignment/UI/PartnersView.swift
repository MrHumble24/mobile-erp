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
    @State private var showFilters = false
    @State private var showStats = false

    private var hasActiveFilters: Bool {
        guard let model else { return false }
        return model.active != .all || model.overdueOnly
    }

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
            @Bindable var model = model
            List {
                if model.offline {
                    Label(i18n.t("common.offline", default: "Offline — showing cached balances"),
                          systemImage: "wifi.slash")
                        .font(.caption)
                        .foregroundStyle(Tokens.warning)
                        .listRowBackground(Color.clear)
                }
                listBody(model)
            }
            .listStyle(.plain)
            .searchable(text: $model.search, prompt: i18n.t("partners.searchPlaceholder"))
            .refreshable { await model.load() }
            .overlay { if model.isLoading && model.partners.isEmpty { LoadingView() } }
            .sheet(isPresented: $showFilters) {
                PartnersFilterSheet(model: model)
            }
            .sheet(isPresented: $showStats) {
                PartnersStatsView(model: model)
            }
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
            ToolbarItem(placement: .primaryAction) {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    showCreate = true
                } label: {
                    Image(systemName: "plus")
                        .font(.body.weight(.semibold))
                }
            }
        }

        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    showFilters = true
                } label: {
                    Label(
                        hasActiveFilters
                            ? i18n.t("partners.filterActive", default: "Filtrlar (Faol)")
                            : i18n.t("common.filter", default: "Filtrlar"),
                        systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease"
                    )
                }

                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    showStats = true
                } label: {
                    Label(
                        i18n.t("partners.statsTitle", default: "Statistika"),
                        systemImage: "chart.bar.xaxis"
                    )
                }

                Divider()

                if let name = container.session.user?.displayName {
                    Text(name)
                }
                LocaleMenu(i18n: i18n)

                Button(role: .destructive) {
                    container.session.logout()
                } label: {
                    Label(i18n.t("auth.logout", default: "Chiqish"),
                          systemImage: "rectangle.portrait.and.arrow.right")
                }
            } label: {
                Image(systemName: hasActiveFilters ? "ellipsis.circle.fill" : "ellipsis.circle")
                    .font(.body.weight(.medium))
                    .foregroundStyle(hasActiveFilters ? Tokens.signalBlue : .primary)
            }
        }
    }
}
