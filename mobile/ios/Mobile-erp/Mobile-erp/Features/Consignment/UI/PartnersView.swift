import SwiftUI

/// Partner directory (`partner.read`): the system search bar, filter + new
/// partner in the toolbar, the summary list-card (partners, outstanding), then
/// one card per partner with a record-payment pill (`partner.payment`). Offline
/// shows the cached mirror with a notice. Title is the tab label
/// (`nav.partners`), the same string as the Android top bar.
struct PartnersView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model: PartnersListModel?
    @State private var detail: Partner?
    @State private var payFor: Partner?
    @State private var showCreate = false
    @State private var showFilters = false

    private var hasActiveFilters: Bool {
        guard let model else { return false }
        return model.active != .all || model.overdueOnly
    }

    var body: some View {
        content
            .navigationTitle(i18n.t("nav.partners"))
            .toolbar { toolbar }
            .task { if model == nil { let m = container.makePartnersListModel(); model = m; await m.load() } }
            .sheet(isPresented: $showCreate) {
                PartnerFormSheet(mode: .create) { Task { await model?.load() } }
            }
            .sheet(item: $detail) { partner in
                PartnerDetailView(partner: partner) { Task { await model?.load() } }
            }
            .sheet(item: $payFor) { partner in
                RecordPaymentSheet(partner: partner) { Task { await model?.load() } }
            }
            #if DEBUG
            // Screenshot helper: `-openPartner first` opens the first partner's detail.
            .onChange(of: model?.partners.count ?? 0) { _, count in
                guard count > 0, detail == nil,
                      UserDefaults.standard.string(forKey: "openPartner") == "first" else { return }
                detail = model?.filtered.first
            }
            #endif
    }

    @ViewBuilder private var content: some View {
        if let model {
            @Bindable var model = model
            ScrollView {
                VStack(spacing: Tokens.Space.lg) {
                    if model.offline {
                        StatusBadge(i18n.t("common.offline"), color: Tokens.warning)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    MetricList(rows: [
                        MetricRow(label: i18n.t("partners.statsPartners"), value: "\(model.filtered.count)"),
                        MetricRow(label: i18n.t("partners.statsOutstanding"), value: MoneyText.format(model.outstanding)),
                    ])
                    list(model)
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.lg)
            }
            .background(Tokens.ground)
            .searchable(text: $model.search, prompt: i18n.t("partners.searchPlaceholder"))
            .refreshable { await model.load() }
            .sheet(isPresented: $showFilters) { PartnersFilterSheet(model: model) }
        } else {
            LoadingView()
        }
    }

    @ViewBuilder private func list(_ model: PartnersListModel) -> some View {
        if model.filtered.isEmpty {
            if model.isLoading {
                AppCard { LoadingView().frame(height: 120) }
            } else {
                AppCard { EmptyStateView(systemImage: "person.2", title: i18n.t("partners.noPartnersFound")) }
            }
        } else {
            let canPay = container.session.can("partner.payment")
            ForEach(model.filtered) { partner in
                PartnerListRow(partner: partner,
                               onOpen: { detail = partner },
                               onPay: canPay ? { payFor = partner } : nil)
            }
        }
    }

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { showFilters = true } label: {
                Label(i18n.t("common.filter"),
                      systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
            }
        }
        if container.session.can("partner.manage") {
            ToolbarItem(placement: .primaryAction) {
                Button { Haptic.tick.play(); showCreate = true } label: {
                    Label(i18n.t("partners.newPartner"), systemImage: "person.badge.plus")
                }
            }
        }
    }
}
