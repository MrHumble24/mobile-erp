import SwiftUI

/// Repairs (Change 13, ADR 0040): status chips, a search (ticket / IMEI / serial
/// / customer) and the rows; tap for the ticket detail. "New ticket"
/// (`repair.manage`) and the repairs report (`repair.read`) open from the
/// toolbar. Online only; the whole feature is hidden while the setting is off.
struct RepairsView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = RepairsListModel()
    @State private var tab = ""
    @State private var selected: RepairListItem?
    @State private var showNew = false
    @State private var showReport = false

    private var canManage: Bool { container.session.can("repair.manage") }

    private var chips: [TabChipItem<String>] {
        [TabChipItem(value: "", label: i18n.t("repairs.allTickets", default: "All"))]
            + RepairStatus.all.map { TabChipItem(value: $0, label: RepairStatus.label($0, i18n)) }
    }

    var body: some View {
        @Bindable var model = model
        VStack(spacing: 0) {
            TabChips(selection: $tab, items: chips)
                .padding(.vertical, Tokens.Space.md)
                .onChange(of: tab) { _, t in model.status = t.isEmpty ? nil : t; model.reload() }
            content
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("repairs.title", default: "Repairs"))
        .searchable(text: $model.search, prompt: i18n.t("repairs.searchPlaceholder", default: "Ticket, IMEI, customer"))
        .onSubmit(of: .search) { model.reload() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showReport = true } label: { Image(systemName: "chart.bar") }
            }
            if canManage {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showNew = true } label: { Image(systemName: "plus") }
                }
            }
        }
        .appSheet(isPresented: $showNew) { NewRepairSheet { model.reload() } }
        .appSheet(item: $selected) { RepairDetailSheet(repairId: $0.id) { model.reload() } }
        .sheet(isPresented: $showReport) { RepairReportSheet() }
        .task {
            model.configure(container)
            #if DEBUG
            _ = RepairStatusSelfCheck.ran
            if canManage, KitDebugLaunch.consume("openNewRepair") != nil { showNew = true }
            if KitDebugLaunch.consume("openRepairReport") != nil { showReport = true }
            #endif
            if model.items.isEmpty { model.reload() }
        }
        .refreshable { model.reload() }
        #if DEBUG
        .onChange(of: model.items.count) { _, count in
            if count > 0, KitDebugLaunch.consume("openRepair") != nil { selected = model.items.first }
        }
        #endif
    }

    @ViewBuilder private var content: some View {
        if model.disabled {
            EmptyStateView(systemImage: "wrench.and.screwdriver", title: i18n.t("repairs.offTitle", default: "Repairs are turned off"),
                           message: i18n.t("repairs.settingsHint", default: "Turn repairs on in Settings."))
        } else if model.offline {
            EmptyStateView(systemImage: "wifi.slash", title: i18n.t("common.offline"),
                           message: i18n.t("repairs.onlineOnly", default: "Repairs are available online only."))
        } else if model.loading && model.items.isEmpty {
            LoadingView()
        } else if let error = model.error, model.items.isEmpty {
            ErrorStateView(message: error) { model.reload() }
        } else if model.items.isEmpty {
            EmptyStateView(systemImage: "wrench.and.screwdriver", title: i18n.t("repairs.empty", default: "No tickets yet"))
        } else {
            ScrollView {
                VStack(spacing: Tokens.Space.md) {
                    ForEach(model.items) { ticket in
                        Button { selected = ticket } label: { RepairRow(ticket: ticket) }
                            .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.md)
            }
        }
    }
}

/// One ticket row: number + customer + device, a status chip, left-to-pay.
private struct RepairRow: View {
    let ticket: RepairListItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("#\(ticket.ticketNumber) · \(ticket.customer.name)").font(.ui(.body)).foregroundStyle(Tokens.text)
                    Text(ticket.deviceName).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    HStack(spacing: Tokens.Space.sm) {
                        StatusBadge(RepairStatus.label(ticket.statusCode, i18n), color: statusColor(ticket.statusCode))
                        Text(KitDate.day(ticket.receivedAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                }
                Spacer(minLength: Tokens.Space.sm)
                VStack(alignment: .trailing, spacing: 2) {
                    if ticket.owes {
                        Text(i18n.t("repairs.outstanding", default: "Owed")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                        MoneyText(value: ticket.outstanding, size: 15).fontWeight(.semibold).foregroundStyle(Tokens.danger)
                    } else {
                        MoneyText(value: ticket.agreedPrice, size: 15).foregroundStyle(Tokens.text)
                    }
                }
            }
        }
    }

    private func statusColor(_ code: String) -> Color {
        switch code {
        case "RECEIVED": Tokens.info
        case "IN_REPAIR": Tokens.warning
        case "READY": Tokens.action
        case "GIVEN_BACK": Tokens.success
        case "CANCELLED": Tokens.danger
        default: Tokens.muted
        }
    }
}
