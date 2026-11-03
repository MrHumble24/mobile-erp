import SwiftUI

/// Consignments list screen (`consignment.read`): filters, summary tiles, the
/// paginated list with per-row settle/return, a detail sheet, and a
/// pending-sync marker for queued offline writes. New-consignment
/// (`consignment.create`) works offline via the outbox.
struct ConsignmentsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var model: ConsignmentsListModel?
    @State private var detailId: String?
    @State private var settleItem: Consignment?
    @State private var returnItem: Consignment?
    @State private var showCreate = false
    @State private var showFilters = false
    @State private var showStats = false

    private var hasActiveFilters: Bool {
        guard let model else { return false }
        return model.status != .all || model.preset != .all || !model.customFrom.isEmpty || !model.customTo.isEmpty
    }

    var body: some View {
        content
            .navigationTitle(i18n.t("consignments.title"))
            .toolbar { toolbar }
            .task {
                if model == nil { let m = container.makeConsignmentsListModel(); model = m; await m.load() }
                consumeRoute()
                #if DEBUG
                consignmentSelfCheck()
                #endif
            }
            .onChange(of: container.router.pending) { consumeRoute() }
            .sheet(isPresented: $showCreate) {
                ConsignDeviceSheet(partnerId: nil, lockPartner: false) { Task { await model?.load() } }
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
    }

    @ViewBuilder private var content: some View {
        if let model {
            @Bindable var model = model
            VStack(spacing: 0) {
                if hasActiveFilters {
                    activeFilterBar(model)
                }

                List {
                    if model.pendingCount > 0 { pendingMarker(model.pendingCount) }
                    body(model)
                }
                .listStyle(.insetGrouped)
                .searchable(text: $model.search, prompt: i18n.t("consignments.searchPlaceholder"))
                .onSubmit(of: .search) { Task { await model.load() } }
                .refreshable { await model.load() }
                .overlay {
                    if (model.isLoading || model.pager.isLoading) && model.items.isEmpty {
                        LoadingView()
                    }
                }
            }
            .sheet(isPresented: $showFilters) {
                ConsignmentsFilterSheet(model: model) { Task { await model.load() } }
            }
            .sheet(isPresented: $showStats) {
                ConsignmentsStatsView(model: model)
            }
        } else {
            LoadingView()
        }
    }

    /// Open the detail sheet when another feature routed here with an id.
    private func consumeRoute() {
        if let route = container.router.consume("consignments"),
           case let .consignments(id) = route, let id {
            detailId = id
        }
    }

    @ViewBuilder private func body(_ model: ConsignmentsListModel) -> some View {
        if model.offline {
            Section {
                EmptyStateView(systemImage: "wifi.slash",
                               title: i18n.t("common.offline", default: "Offline"),
                               message: i18n.t("consignments.noConsignmentsFound"))
            }
            .listRowBackground(Color.clear)
        } else if let error = model.error, model.items.isEmpty {
            Section {
                ErrorStateView(message: error) {
                    Task { await model.load() }
                }
            }
            .listRowBackground(Color.clear)
        } else if model.items.isEmpty && !model.isLoading && !model.pager.isLoading {
            Section {
                EmptyStateView(systemImage: "shippingbox",
                               title: i18n.t("consignments.noConsignmentsFound"))
            }
            .listRowBackground(Color.clear)
        } else {
            ForEach(model.items) { item in
                Section {
                    Button {
                        detailId = item.id
                    } label: {
                        ConsignmentRow(item: item,
                                       onSettle: { settleItem = item },
                                       onReturn: { returnItem = item })
                    }
                    .buttonStyle(.plain)
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        if item.isOut {
                            Button {
                                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                                settleItem = item
                            } label: {
                                Label(i18n.t("consignments.settle", default: "Settle"), systemImage: "checkmark.circle.fill")
                            }
                            .tint(Tokens.success)

                            Button {
                                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                                returnItem = item
                            } label: {
                                Label(i18n.t("consignments.return", default: "Return"), systemImage: "arrow.uturn.backward")
                            }
                            .tint(Tokens.danger)
                        }
                    }
                }
            }
            Section {
                KitLoadMoreFooter(pager: model.pager)
            }
            .listRowBackground(Color.clear)
        }
    }

    private func activeFilterBar(_ model: ConsignmentsListModel) -> some View {
        HStack(spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "line.3.horizontal.decrease.circle.fill")
                    .font(.caption)
                if model.status != .all {
                    Text(i18n.t(model.status.labelKey))
                        .font(.caption.weight(.semibold))
                }
                if model.preset != .all {
                    Text(model.preset.labelKey.map { i18n.t($0) } ?? "")
                        .font(.caption.weight(.semibold))
                }
            }
            .foregroundStyle(Tokens.signalBlue)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Tokens.signalBlue.opacity(0.12), in: Capsule())

            Spacer()

            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                model.reset()
                Task { await model.load() }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "xmark.circle.fill")
                    Text(i18n.t("common.reset", default: "Tozalash"))
                }
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
        .background(Color(.secondarySystemGroupedBackground))
    }

    private func pendingMarker(_ count: Int) -> some View {
        Label("\(count) \(i18n.t("common.pendingSync", default: "pending sync"))",
              systemImage: "arrow.triangle.2.circlepath")
            .font(.caption).foregroundStyle(Tokens.signalBlue)
            .listRowBackground(Color.clear)
    }

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        if container.session.can("consignment.create") {
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
                // 1. Filtrlar
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    showFilters = true
                } label: {
                    Label(
                        hasActiveFilters
                            ? i18n.t("consignments.filterActive", default: "Filtrlar (Faol)")
                            : i18n.t("common.filter", default: "Filtrlar"),
                        systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease"
                    )
                }

                // 2. Statistika
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    showStats = true
                } label: {
                    Label(
                        i18n.t("consignments.statsTitle", default: "Tahlil va Statistika"),
                        systemImage: "chart.bar.xaxis"
                    )
                }

                // 3. CSV eksport
                if let model, !model.items.isEmpty {
                    KitCSVShareButton(
                        filename: "consignments.csv",
                        label: i18n.t("consignments.exportCsv", default: "CSV yuklash")
                    ) {
                        ConsignmentLogic.csv(model.items) { i18n.t($0) }
                    }
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
