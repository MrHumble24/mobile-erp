import SwiftUI

/// Partner detail as a Warm Card sheet: outstanding block + credit bar, the
/// permission-gated actions (payment = the one orange, consign secondary, edit
/// ghost), the aging buckets as keyed rows and the running-balance ledger as
/// hairline rows. Ledger and aging are online-only; offline shows a notice.
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
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: partner.shopName) { dismiss() }
                SubjectBlock(title: i18n.t("partners.outstanding"), line: MoneyText.format(partner.outstanding))
                CreditBar(limit: partner.creditLimit, used: partner.outstanding)
                actions
                if let model, model.error == "offline" {
                    FormErrorLine(message: i18n.t("common.offline"), color: Tokens.warning)
                } else {
                    aging
                    ledger
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.large])
        .task { if model == nil { let m = container.makePartnerDetailModel(); model = m; await m.load(partnerId: partner.id) } }
        .sheet(isPresented: $showPayment) { RecordPaymentSheet(partner: partner) { reload() } }
        .sheet(isPresented: $showEdit) { PartnerFormSheet(mode: .edit(partner)) { reload() } }
        .sheet(isPresented: $showConsign) { ConsignDeviceSheet(partnerId: partner.id, lockPartner: true) { reload() } }
    }

    private func reload() {
        onChange()
        Task { await model?.load(partnerId: partner.id) }
    }

    @ViewBuilder private var actions: some View {
        VStack(spacing: Tokens.Space.sm) {
            if can.can("partner.payment") {
                Button { Haptic.tick.play(); showPayment = true } label: {
                    Text(i18n.t("partners.recordPayment")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
            }
            if can.can("consignment.create") {
                Button { Haptic.tick.play(); showConsign = true } label: {
                    Text(i18n.t("partners.newConsignmentForPartner")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillSecondary)
            }
            if can.can("partner.manage") {
                Button { Haptic.tick.play(); showEdit = true } label: {
                    Text(i18n.t("partners.editPartner")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillGhost)
            }
        }
    }

    @ViewBuilder private var aging: some View {
        if let model, model.hasAging {
            Text(i18n.t("partners.agingTitle")).font(.ui(.heading)).foregroundStyle(Tokens.text)
            let buckets = model.aging
            VStack(spacing: 0) {
                ForEach(Array(buckets.enumerated()), id: \.offset) { i, b in
                    FactRow(label: "\(i18n.t("partners.aging_\(b.bucket)")) · \(b.count)", last: i == buckets.count - 1) {
                        MoneyText(value: b.amount, size: 15).fontWeight(.semibold)
                            .foregroundStyle(b.isOverdue && b.count > 0 ? Tokens.danger : Tokens.text)
                    }
                }
            }
        }
    }

    @ViewBuilder private var ledger: some View {
        Text(i18n.t("partners.ledgerTitle")).font(.ui(.heading)).foregroundStyle(Tokens.text)
        if let model, model.isLoading {
            LoadingView().frame(height: 80)
        } else if let model, model.ledger.isEmpty {
            Text(i18n.t("partners.noLedgerEntries")).font(.ui(.body)).foregroundStyle(Tokens.muted)
        } else if let model {
            VStack(spacing: 0) {
                ForEach(Array(model.ledger.enumerated()), id: \.offset) { i, entry in
                    LedgerRow(entry: entry)
                    if i < model.ledger.count - 1 { Divider().overlay(Tokens.border) }
                }
            }
        }
    }
}

/// A ledger line, not a nested card: kind pill + signed mono change, then
/// date · running balance, then notes.
private struct LedgerRow: View {
    let entry: LedgerEntry
    @Environment(I18n.self) private var i18n

    var body: some View {
        let change = Double(entry.change) ?? 0
        VStack(alignment: .leading, spacing: Tokens.Space.xs) {
            HStack {
                StatusBadge(i18n.t(entry.isConsignment ? "partners.kindConsignment" : "partners.kindPayment"),
                            color: entry.isConsignment ? Tokens.info : Tokens.success)
                Spacer()
                Text(change > 0 ? "+\(MoneyText.format(entry.change))" : MoneyText.format(entry.change))
                    .font(.mono(15, weight: .semibold))
                    .foregroundStyle(change > 0 ? Tokens.warning : Tokens.success)
            }
            HStack {
                Text(KitDate.day(entry.at)).font(.data(.regular)).foregroundStyle(Tokens.muted)
                Spacer()
                Text("\(i18n.t("partners.runningBalance")): \(MoneyText.format(entry.runningBalance))")
                    .font(.ui(.caption)).foregroundStyle(Tokens.muted)
            }
            if let notes = entry.notes, !notes.isEmpty {
                Text(notes).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            }
        }
        .padding(.vertical, Tokens.Space.sm)
    }
}
