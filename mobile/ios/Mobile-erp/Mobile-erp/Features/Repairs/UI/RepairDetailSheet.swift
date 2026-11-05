import SwiftUI

/// One repair ticket in full (ADR 0040): the device + status, money summary,
/// the legal next-status actions, parts (add / remove), payments (take / refund),
/// the outside-master payment, status history and the warranty once given back.
/// Cost figures are hidden without `device.cost.view`. Online only.
struct RepairDetailSheet: View {
    let repairId: String
    let onChanged: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var repair: RepairView?
    @State private var error: String?
    @State private var statusTarget: StatusTarget?
    @State private var showAddPart = false
    @State private var money: RepairMoneyKind?

    private var canManage: Bool { container.session.can("repair.manage") }
    private var canPay: Bool { container.session.can("repair.payment") }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.gutter) {
                SheetTitleRow(title: repair.map { "#\($0.ticketNumber)" } ?? i18n.t("repairs.detailTitle", default: "Ticket")) { dismiss() }
                if let repair { body(repair) }
                else if let error { ErrorStateView(message: error) { load() } }
                else { LoadingView().frame(height: 200) }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollBounceBehavior(.basedOnSize)
        .background(Tokens.card)
        .appSheet(item: $statusTarget) { t in
            RepairStatusSheet(repairId: repairId, to: t.code, requiresNote: t.requiresNote) { updated(repair: $0) }
        }
        .appSheet(isPresented: $showAddPart) { RepairPartsSheet(repairId: repairId) { updated(repair: $0) } }
        .appSheet(item: $money) { kind in
            RepairMoneySheet(repairId: repairId, kind: kind,
                             hint: moneyHint(kind)) { updated(repair: $0) }
        }
        .task { if repair == nil { load() } }
    }

    private func body(_ r: RepairView) -> some View {
        VStack(alignment: .leading, spacing: Tokens.Space.gutter) {
            SubjectBlock(title: r.deviceName, line: r.code.isEmpty ? r.problem : r.code) {
                StatusBadge(RepairStatus.label(r.statusCode, i18n), color: Tokens.info)
            }
            RepairMoneySummary(repair: r)
            RepairMasterRow(repair: r)
            if !r.isTerminal { actions(r) }
            RepairPartsSection(repair: r, canManage: canManage && !r.isTerminal) { partId in remove(partId, from: r) }
            RepairPaymentsSection(repair: r)
            if let until = r.warrantyUntil { RepairWarrantyRow(until: until, underWarranty: r.underWarranty) }
            RepairHistorySection(repair: r)
            if let error { FormErrorLine(message: error) }
        }
    }

    private func actions(_ r: RepairView) -> some View {
        VStack(spacing: Tokens.Space.sm) {
            if canManage {
                ForEach(RepairStatus.nextMoves(from: r.statusCode), id: \.self) { to in
                    Button {
                        let needsNote = to == "CANCELLED" || (to == "GIVEN_BACK" && r.owes)
                        statusTarget = StatusTarget(code: to, requiresNote: needsNote)
                    } label: {
                        Text(RepairStatus.label(to, i18n)).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(to == "CANCELLED" ? .pillDestructive : .pillSecondary)
                }
                Button { showAddPart = true } label: {
                    Label(i18n.t("repairs.addPart", default: "Add a part"), systemImage: "plus").frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillGhost)
            }
            if canPay {
                Button { money = .payment } label: {
                    Label(i18n.t("repairs.takePayment", default: "Take payment"), systemImage: "banknote").frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                Button { money = .refund } label: {
                    Text(i18n.t("repairs.refund", default: "Refund")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillGhost)
                if r.master?.isOutside == true {
                    Button { money = .outside } label: {
                        Label(i18n.t("repairs.outsidePayment", default: "Pay outside master"), systemImage: "arrow.up.forward").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.pillGhost)
                }
            }
        }
    }

    private func moneyHint(_ kind: RepairMoneyKind) -> String? {
        guard let r = repair else { return nil }
        switch kind {
        case .payment: return "\(i18n.t("repairs.outstanding", default: "Owed")): \(MoneyText.format(r.outstanding))"
        case .refund: return "\(i18n.t("repairs.paid", default: "Paid")): \(MoneyText.format(r.paid))"
        case .outside: return r.outsideCost.map { "\(i18n.t("repairs.outsideCost", default: "We pay")): \(MoneyText.format($0))" }
        }
    }

    private func updated(repair r: RepairView) { repair = r; onChanged() }

    private func load() {
        error = nil
        Task {
            do { repair = try await RepairsRepository(container).get(repairId) }
            catch let e as AppError { error = RepairError.message(e, i18n) }
            catch { self.error = error.localizedDescription }
        }
    }

    private func remove(_ partId: String, from r: RepairView) {
        Task {
            do {
                try await RepairsRepository(container).removePart(repairId, partId: partId)
                load(); onChanged()
            } catch let e as AppError { error = RepairError.message(e, i18n) }
            catch { self.error = error.localizedDescription }
        }
    }
}

/// A chosen status move + whether it needs a note; drives the status sheet.
private struct StatusTarget: Identifiable {
    let code: String
    let requiresNote: Bool
    var id: String { code }
}

extension RepairMoneyKind: Identifiable { var id: String { "\(self)" } }
