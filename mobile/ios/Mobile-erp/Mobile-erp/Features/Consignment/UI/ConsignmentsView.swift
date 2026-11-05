import SwiftUI

/// Consignments (`consignment.read`): a status chip row (All / Out / Overdue /
/// Settled / Returned, the open and overdue chips carrying live counts), the
/// system search bar, period filter + new consignment + CSV in the toolbar,
/// the summary list-card, then one card per row with settle / return on OUT
/// rows. Offline writes park in the outbox (pending pill). Title is the tab
/// label (`nav.consignments`), the same string as the Android top bar.
struct ConsignmentsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var model: ConsignmentsListModel?
    @State private var detailId: String?
    @State private var settleItem: Consignment?
    @State private var returnItem: Consignment?
    @State private var showCreate = false
    @State private var showFilters = false
    @State private var consignInitialCode: String?

    private var hasActiveFilters: Bool { (model?.preset ?? .all) != .all }

    var body: some View {
        content
            .navigationTitle(i18n.t("nav.consignments"))
            .toolbar { toolbar }
            .task {
                if model == nil { let m = container.makeConsignmentsListModel(); model = m; await m.load() }
                consumeRoute()
                #if DEBUG
                consignmentSelfCheck()
                if let code = KitDebugLaunch.consume("openConsignForm") { consignInitialCode = code; showCreate = true }
                #endif
            }
            .onChange(of: container.router.pending) { consumeRoute() }
            .sheet(isPresented: $showCreate) {
                ConsignDeviceSheet(partnerId: nil, lockPartner: false, initialCode: consignInitialCode) { Task { await model?.load() } }
            }
            .sheet(item: $settleItem) { item in
                SettleConsignmentSheet(consignment: item) { Task { await model?.load() } }
            }
            .sheet(item: $returnItem) { item in
                ReturnConsignmentSheet(consignment: item) { Task { await model?.load() } }
            }
            .sheet(isPresented: Binding(get: { detailId != nil }, set: { if !$0 { detailId = nil } })) {
                if let id = detailId {
                    ConsignmentDetailView(
                        consignmentId: id,
                        onSettle: { settleItem = $0; detailId = nil },
                        onReturn: { returnItem = $0; detailId = nil })
                }
            }
            #if DEBUG
            // Screenshot helper: `-openConsignment first` opens the first row's detail.
            .onChange(of: model?.items.count ?? 0) { _, count in
                guard count > 0, detailId == nil,
                      KitDebugLaunch.consume("openConsignment") == "first" else { return }
                detailId = model?.items.first?.id
            }
            #endif
    }

    @ViewBuilder private var content: some View {
        if let model {
            @Bindable var model = model
            ScrollView {
                VStack(spacing: Tokens.Space.lg) {
                    ConsignmentStatusChips(selection: $model.status, open: model.stats?.openCount,
                                           overdue: model.stats?.overdueCount) { Task { await model.load() } }
                    if model.pendingCount > 0 {
                        StatusBadge("\(i18n.t("common.loading")) · \(model.pendingCount)", color: Tokens.warning)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, Tokens.Space.gutter)
                    }
                    VStack(spacing: Tokens.Space.lg) {
                        if let s = model.stats { summary(s) }
                        list(model)
                    }
                    .padding(.horizontal, Tokens.Space.gutter)
                }
                .padding(.vertical, Tokens.Space.lg)
            }
            .background(Tokens.ground)
            .searchable(text: $model.search, prompt: i18n.t("consignments.searchPlaceholder"))
            .onSubmit(of: .search) { Task { await model.load() } }
            .refreshable { await model.load() }
            .sheet(isPresented: $showFilters) {
                ConsignmentsFilterSheet(model: model) { Task { await model.load() } }
            }
        } else {
            LoadingView()
        }
    }

    private func summary(_ s: ConsignmentStats) -> some View {
        MetricList(rows: [
            MetricRow(label: i18n.t("consignments.statsOpen"), value: "\(s.openCount)"),
            MetricRow(label: i18n.t("consignments.statsOutstanding"), value: MoneyText.format(s.outstanding)),
            MetricRow(label: i18n.t("consignments.statsOverdue"), value: "\(s.overdueCount)",
                      emphasis: s.overdueCount > 0 ? Tokens.danger : nil),
        ])
    }

    @ViewBuilder private func list(_ model: ConsignmentsListModel) -> some View {
        if model.offline {
            AppCard { EmptyStateView(systemImage: "wifi.slash", title: i18n.t("common.offline")) }
        } else if let error = model.error, model.items.isEmpty {
            AppCard { ErrorStateView(message: error, retry: { Task { await model.load() } }) }
        } else if model.items.isEmpty {
            if model.isLoading || model.pager.isLoading {
                AppCard { LoadingView().frame(height: 120) }
            } else {
                AppCard { EmptyStateView(systemImage: "shippingbox", title: i18n.t("consignments.noConsignmentsFound")) }
            }
        } else {
            ForEach(model.items) { item in
                ConsignmentRow(item: item,
                               onOpen: { detailId = item.id },
                               onSettle: { settleItem = item },
                               onReturn: { returnItem = item })
            }
            KitLoadMoreFooter(pager: model.pager)
        }
    }

    /// Open the detail sheet when another feature routed here with an id.
    private func consumeRoute() {
        if let route = container.router.consume("consignments"),
           case let .consignments(id) = route, let id {
            detailId = id
        }
    }

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { showFilters = true } label: {
                Label(i18n.t("common.filter"),
                      systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
            }
        }
        if container.session.can("consignment.create") {
            ToolbarItem(placement: .primaryAction) {
                Button { Haptic.tick.play(); showCreate = true } label: {
                    Label(i18n.t("consignments.newConsignment"), systemImage: "plus")
                }
            }
        }
        if let model, !model.items.isEmpty {
            ToolbarItem(placement: .secondaryAction) {
                KitCSVShareButton(filename: "consignments.csv", label: i18n.t("consignments.exportCsv")) {
                    ConsignmentLogic.csv(model.items) { i18n.t($0) }
                }
            }
        }
    }
}

/// The status tabs on the kit chip row; Out and Overdue carry their live counts.
private struct ConsignmentStatusChips: View {
    @Environment(I18n.self) private var i18n
    @Binding var selection: ConsignmentStatusFilter
    let open: Int?
    let overdue: Int?
    let onChange: () -> Void

    var body: some View {
        TabChips(selection: $selection, items: ConsignmentStatusFilter.allCases.map { status in
            TabChipItem(value: status, label: i18n.t(status.labelKey),
                        count: status == .out ? open : status == .overdue ? overdue : nil, hue: hue(status))
        }, onChange: onChange)
    }

    private func hue(_ status: ConsignmentStatusFilter) -> Color {
        switch status {
        case .all: return Tokens.text
        case .out: return Tokens.info
        case .overdue: return Tokens.danger
        case .settled: return Tokens.success
        case .returned: return Tokens.sold
        }
    }
}
