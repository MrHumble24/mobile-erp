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
                Section {
                    heroPartnerCard
                    actions
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))

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

    private var heroPartnerCard: some View {
        let outstandingVal = Double(partner.outstanding) ?? 0
        let hasOverdue = (partner.overdueCount ?? 0) > 0
        let limitVal = Double(partner.creditLimit) ?? 0

        return AppCard(
            padding: 18,
            backgroundColor: (hasOverdue ? Tokens.danger : (outstandingVal > 0 ? Tokens.warning : Tokens.success)).opacity(0.10),
            borderColor: (hasOverdue ? Tokens.danger : (outstandingVal > 0 ? Tokens.warning : Tokens.success)).opacity(0.35)
        ) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label(
                        i18n.t("partners.outstanding", default: "Current Outstanding Debt"),
                        systemImage: hasOverdue ? "exclamationmark.triangle.fill" : "banknote"
                    )
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(hasOverdue ? Tokens.danger : (outstandingVal > 0 ? Tokens.warning : Tokens.success))

                    Spacer()

                    if hasOverdue {
                        StatusBadge(i18n.t("partners.hasOverdue", default: "Overdue"), color: Tokens.danger)
                    }
                }

                MoneyText(value: partner.outstanding, size: 30)
                    .foregroundStyle(hasOverdue ? Tokens.danger : (outstandingVal > 0 ? Tokens.ink : Tokens.success))

                if limitVal > 0 {
                    let pct = min(1.0, max(0.0, outstandingVal / limitVal))
                    VStack(alignment: .leading, spacing: 4) {
                        ProgressView(value: pct)
                            .tint(hasOverdue ? Tokens.danger : (pct > 0.85 ? Tokens.warning : Tokens.signalBlue))
                        HStack {
                            Text(i18n.t("partners.creditLimit", default: "Limit: \(MoneyText.format(partner.creditLimit))"))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text("\(Int(pct * 100))% used")
                                .font(.caption2.weight(.medium))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.top, 4)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func reload() {
        onChange()
        Task { await model?.load(partnerId: partner.id) }
    }

    @ViewBuilder private var actions: some View {
        VStack(spacing: 10) {
            if can.can("partner.payment") {
                Button {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    showPayment = true
                } label: {
                    Label(i18n.t("partners.recordPayment", default: "Record Debt Payment"), systemImage: "creditcard.fill")
                        .font(.body.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                }
                .buttonStyle(.borderedProminent)
                .tint(Tokens.ink)
            }
            HStack(spacing: 10) {
                if can.can("consignment.create") {
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        showConsign = true
                    } label: {
                        Label(i18n.t("partners.newConsignmentForPartner", default: "Consign Unit"), systemImage: "arrow.left.arrow.right")
                            .font(.subheadline.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                    }
                    .buttonStyle(.bordered)
                }
                if can.can("partner.manage") {
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        showEdit = true
                    } label: {
                        Label(i18n.t("partners.editPartner", default: "Edit Partner"), systemImage: "pencil")
                            .font(.subheadline.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
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
            Section(i18n.t("partners.agingTitle", default: "Debt Aging Analysis")) {
                ForEach(model.aging.filter { $0.count > 0 }) { b in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("partners.aging_\(b.bucket)"))
                                .font(.body.weight(.medium))
                                .foregroundStyle(Tokens.ink)
                            Text("\(b.count) \(i18n.t("partners.openCount", default: "devices"))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            MoneyText(value: b.amount, size: 16)
                                .foregroundStyle(b.isOverdue ? Tokens.danger : Tokens.ink)
                            if b.isOverdue {
                                Text(i18n.t("partners.statusOverdue", default: "Overdue"))
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(Tokens.danger)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }

    @ViewBuilder private var ledgerSection: some View {
        Section(i18n.t("partners.ledgerTitle", default: "Transaction Ledger")) {
            if let model, model.isLoading {
                ProgressView()
            } else if let model, model.ledger.isEmpty {
                Text(i18n.t("partners.noLedgerEntries", default: "No ledger transactions recorded."))
                    .font(.callout)
                    .foregroundStyle(.secondary)
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
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                StatusBadge(
                    i18n.t(entry.isConsignment ? "partners.kindConsignment" : "partners.kindPayment"),
                    color: entry.isConsignment ? Tokens.signalBlue : Tokens.success)
                Spacer()
                Text(change > 0 ? "+\(MoneyText.format(entry.change))" : MoneyText.format(entry.change))
                    .font(.mono(15, weight: .bold))
                    .foregroundStyle(change > 0 ? Tokens.warning : Tokens.success)
            }
            HStack {
                Text(entry.at.prefix(10)).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text("\(i18n.t("partners.runningBalance")): \(MoneyText.format(entry.runningBalance))")
                    .font(.caption.weight(.medium)).foregroundStyle(Tokens.ink)
            }
            if let notes = entry.notes, !notes.isEmpty {
                Text(notes).font(.caption).italic().foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
