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

    var body: some View {
        content
            .navigationTitle(i18n.t("consignments.title"))
            .toolbar { toolbar }
            .task {
                if model == nil { let m = container.makeConsignmentsListModel(); model = m; await m.load() }
                #if DEBUG
                consignmentSelfCheck()
                #endif
            }
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
            List {
                if model.pendingCount > 0 { pendingMarker(model.pendingCount) }
                Section {
                    ConsignmentsFilterBar(model: model) { Task { await model.load() } }
                        .listRowBackground(Color.clear)
                }
                Section { ConsignmentsSummary(model: model) }
                    .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                    .listRowBackground(Color.clear)
                body(model)
            }
            .listStyle(.plain)
            .refreshable { await model.load() }
            .overlay { if model.isLoading && model.items.isEmpty { LoadingView() } }
        } else {
            LoadingView()
        }
    }

    @ViewBuilder private func body(_ model: ConsignmentsListModel) -> some View {
        if model.offline {
            EmptyStateView(systemImage: "wifi.slash",
                           title: i18n.t("common.offline", default: "Offline"),
                           message: i18n.t("consignments.noConsignmentsFound"))
                .listRowBackground(Color.clear)
        } else if model.items.isEmpty && !model.isLoading {
            EmptyStateView(systemImage: "arrow.left.arrow.right",
                           title: i18n.t("consignments.noConsignmentsFound"))
                .listRowBackground(Color.clear)
        } else {
            Section {
                ForEach(model.items) { item in
                    Button { detailId = item.id } label: {
                        ConsignmentRow(item: item,
                                       onSettle: { settleItem = item },
                                       onReturn: { returnItem = item })
                    }
                    .buttonStyle(.plain)
                }
            }
            if model.totalPages > 1 { pager(model) }
        }
    }

    private func pendingMarker(_ count: Int) -> some View {
        Label("\(count) \(i18n.t("common.pendingSync", default: "pending sync"))",
              systemImage: "arrow.triangle.2.circlepath")
            .font(.caption).foregroundStyle(Tokens.signalBlue)
            .listRowBackground(Color.clear)
    }

    private func pager(_ model: ConsignmentsListModel) -> some View {
        HStack {
            Button { Task { await model.setPage(model.pageIndex - 1) } } label: { Image(systemName: "chevron.left") }
                .disabled(model.pageIndex <= 1)
            Spacer()
            Text("\(model.pageIndex) / \(model.totalPages)").font(.footnote).monospacedDigit()
            Spacer()
            Button { Task { await model.setPage(model.pageIndex + 1) } } label: { Image(systemName: "chevron.right") }
                .disabled(model.pageIndex >= model.totalPages)
        }
        .buttonStyle(.bordered)
        .listRowBackground(Color.clear)
    }

    @ToolbarContentBuilder private var toolbar: some ToolbarContent {
        if container.session.can("consignment.create") {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCreate = true } label: {
                    Label(i18n.t("consignments.newConsignment"), systemImage: "plus")
                }
            }
        }
    }
}
