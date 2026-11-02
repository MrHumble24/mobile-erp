import SwiftUI

/// Partner detail sheet: outstanding header, permission-gated actions (record
/// payment / edit / new consignment), aging buckets and the running-balance
/// ledger. Ledger and aging are online-only; offline shows a notice.
struct PartnerDetailView: View {
    let partner: Partner
    var onChange: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var model: PartnerDetailModel?
    @State private var showPayment = false
    @State private var showEdit = false
    @State private var showConsign = false

    private var can: Session { container.session }

    var body: some View {
        NavigationStack {
            List {
                Section { actions }.listRowBackground(Color.clear)
                if let model, model.error == "offline" {
                    needsConnection
                } else {
                    agingSection
                    ledgerSection
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle(partner.shopName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
            .safeAreaInset(edge: .top) {
                HStack {
                    Text(i18n.t("partners.outstanding")).font(.subheadline).foregroundStyle(.secondary)
                    Spacer()
                    MoneyText(value: partner.outstanding, size: 18).foregroundStyle(Tokens.warning)
                }
                .padding(.horizontal).padding(.vertical, 8)
                .background(.bar)
            }
            .task { if model == nil { let m = container.makePartnerDetailModel(); model = m; await m.load(partnerId: partner.id) } }
            .sheet(isPresented: $showPayment) {
                RecordPaymentSheet(partner: partner) { reload() }
            }
            .sheet(isPresented: $showEdit) {
                PartnerFormSheet(mode: .edit(partner)) { reload() }
            }
            .sheet(isPresented: $showConsign) {
                ConsignDeviceSheet(partnerId: partner.id, lockPartner: true) { reload() }
            }
        }
    }

    private func reload() {
        onChange()
        Task { await model?.load(partnerId: partner.id) }
    }

    @ViewBuilder private var actions: some View {
        VStack(spacing: 8) {
            if can.can("partner.payment") {
                Button { showPayment = true } label: {
                    Label(i18n.t("partners.recordPayment"), systemImage: "creditcard")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
            HStack {
                if can.can("consignment.create") {
                    Button { showConsign = true } label: {
                        Label(i18n.t("partners.newConsignmentForPartner"), systemImage: "arrow.left.arrow.right")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
                if can.can("partner.manage") {
                    Button { showEdit = true } label: {
                        Label(i18n.t("partners.editPartner"), systemImage: "pencil")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }

    private var needsConnection: some View {
        Label(i18n.t("common.offline", default: "Connect to view the ledger."),
              systemImage: "wifi.slash")
            .font(.callout).foregroundStyle(.secondary)
    }

    @ViewBuilder private var agingSection: some View {
        if let model, model.hasAging {
            Section(i18n.t("partners.agingTitle")) {
                ForEach(model.aging.filter { $0.count > 0 }) { b in
                    HStack {
                        Text(i18n.t("partners.aging_\(b.bucket)")).font(.subheadline)
                        if b.isOverdue { StatusBadge("\(b.count)", color: Tokens.warning) }
                        Spacer()
                        MoneyText(value: b.amount, size: 14)
                    }
                }
            }
        }
    }

    @ViewBuilder private var ledgerSection: some View {
        Section(i18n.t("partners.ledgerTitle")) {
            if let model, model.isLoading {
                ProgressView()
            } else if let model, model.ledger.isEmpty {
                Text(i18n.t("partners.noLedgerEntries")).font(.callout).foregroundStyle(.secondary)
            } else if let model {
                ForEach(model.ledger) { LedgerRow(entry: $0) }
            }
        }
    }
}

/// One ledger entry: kind badge, signed change, running balance, timestamp.
private struct LedgerRow: View {
    let entry: LedgerEntry
    @Environment(I18n.self) private var i18n

    var body: some View {
        let change = Double(entry.change) ?? 0
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                StatusBadge(
                    i18n.t(entry.isConsignment ? "partners.kindConsignment" : "partners.kindPayment"),
                    color: entry.isConsignment ? Tokens.signalBlue : Tokens.success)
                Spacer()
                Text(change > 0 ? "+\(MoneyText.format(entry.change))" : MoneyText.format(entry.change))
                    .font(.mono(14, weight: .bold))
                    .foregroundStyle(change > 0 ? Tokens.warning : Tokens.success)
            }
            HStack {
                Text(entry.at.prefix(10)).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text("\(i18n.t("partners.runningBalance")): \(MoneyText.format(entry.runningBalance))")
                    .font(.caption).foregroundStyle(.secondary)
            }
            if let notes = entry.notes, !notes.isEmpty {
                Text(notes).font(.caption).italic().foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}
