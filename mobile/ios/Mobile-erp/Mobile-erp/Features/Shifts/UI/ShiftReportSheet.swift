import SwiftUI

/// A shift's report (ADR 0036): opening, expected, counted, difference, card
/// total, and the movements by type with per-account totals. Used after closing
/// and from the shifts list. With `shift.manage`, an open shift can be force
/// closed.
struct ShiftReportSheet: View {
    let report: ShiftReportView
    var canManage = false
    var onChanged: () -> Void = {}

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var live: ShiftReportView
    @State private var showForceClose = false

    init(report: ShiftReportView, canManage: Bool = false, onChanged: @escaping () -> Void = {}) {
        self.report = report
        self.canManage = canManage
        self.onChanged = onChanged
        _live = State(initialValue: report)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("shifts.report")) { dismiss() }
                header
                summary
                movements
                if canManage && live.isOpen {
                    Button { showForceClose = true } label: {
                        Text(i18n.t("shifts.forceClose")).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.pillDestructive)
                    Text(i18n.t("shifts.forceCloseHint")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.large])
        .appSheet(isPresented: $showForceClose) {
            ForceCloseSheet(shiftId: live.id) { closed in live = closed; onChanged() }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(live.cashier.name).font(.ui(.title)).foregroundStyle(Tokens.text)
            Text("\(i18n.t("shifts.openedAt")): \(KitDate.dayTime(live.openedAt))")
                .font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Text(live.isOpen
                 ? i18n.t("shifts.stillOpen")
                 : "\(i18n.t("shifts.closedAt")): \(KitDate.dayTime(live.closedAt))")
                .font(.ui(.caption)).foregroundStyle(live.isOpen ? Tokens.warning : Tokens.muted)
        }
    }

    private var summary: some View {
        AppCard {
            VStack(spacing: 0) {
                row(i18n.t("shifts.openingCash"), live.openingCount, tint: Tokens.text)
                row(i18n.t("shifts.expectedCash"), live.expectedCash, tint: Tokens.text)
                if let counted = live.countedCash { row(i18n.t("shifts.countedCash"), counted, tint: Tokens.text) }
                if let diff = live.difference { differenceRow(diff) }
                row(i18n.t("shifts.cardTotal"), live.cardTotal, tint: Tokens.muted, last: true)
            }
        }
    }

    @ViewBuilder private var movements: some View {
        if live.byType.isEmpty {
            Text(i18n.t("shifts.noMovements")).font(.ui(.body)).foregroundStyle(Tokens.muted)
        } else {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(i18n.t("shifts.movements")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                AppCard {
                    VStack(spacing: 0) {
                        ForEach(Array(live.byType.enumerated()), id: \.element.id) { i, group in
                            typeRow(group)
                            if i < live.byType.count - 1 { Divider().overlay(Tokens.border) }
                        }
                    }
                }
            }
        }
    }

    private func typeRow(_ group: ShiftTypeGroup) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: Tokens.Space.sm) {
                Text(BalanceFormat.type(group.typeCode, label: nil, i18n))
                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                Text("× \(group.count)").font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer(minLength: Tokens.Space.sm)
                MoneyText(value: group.total, size: 15).foregroundStyle(BalanceFormat.amountTint(group.total))
            }
            ForEach(group.byAccount) { acc in
                HStack(spacing: Tokens.Space.sm) {
                    Text(PaymentAccounts.label(acc.accountCode, i18n)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    Spacer(minLength: Tokens.Space.sm)
                    MoneyText(value: acc.total, size: 13).foregroundStyle(Tokens.muted)
                }
                .padding(.leading, Tokens.Space.md)
            }
        }
        .padding(.vertical, Tokens.Space.sm)
    }

    private func differenceRow(_ diff: String) -> some View {
        let kind = ShiftMath.kind(Decimal(string: diff) ?? 0)
        let tint = kind == .none ? Tokens.success : (kind == .short ? Tokens.danger : Tokens.warning)
        return VStack(spacing: 0) {
            HStack(spacing: Tokens.Space.sm) {
                Text(i18n.t("shifts.difference")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer(minLength: Tokens.Space.sm)
                MoneyText(value: diff, size: 15).foregroundStyle(tint)
            }
            .frame(minHeight: Tokens.Space.rowH)
            Divider().overlay(Tokens.border)
        }
    }

    private func row(_ label: String, _ value: String, tint: Color, last: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: Tokens.Space.sm) {
                Text(label).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer(minLength: Tokens.Space.sm)
                MoneyText(value: value, size: 15).foregroundStyle(tint)
            }
            .frame(minHeight: Tokens.Space.rowH)
            if !last { Divider().overlay(Tokens.border) }
        }
    }
}
