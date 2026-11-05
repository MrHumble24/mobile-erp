import SwiftUI

/// The repair detail's read sections (ADR 0040), split out of the sheet: money
/// summary, master, parts (removable), payments, warranty and status history.
/// Cost figures render only when the server sent them (cost permission).

/// Agreed / paid / outstanding (always) + parts cost / outside paid / profit
/// (cost permission only — nil fields are hidden).
struct RepairMoneySummary: View {
    let repair: RepairView
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(spacing: 0) {
                FactRow(label: i18n.t("repairs.agreedPrice", default: "Agreed price")) {
                    MoneyText(value: repair.agreedPrice, size: 15)
                }
                FactRow(label: i18n.t("repairs.paid", default: "Paid")) {
                    MoneyText(value: repair.paid, size: 15).foregroundStyle(Tokens.success)
                }
                FactRow(label: i18n.t("repairs.outstanding", default: "Owed"),
                        last: repair.partsCost == nil && repair.outsidePaid == nil && repair.profit == nil) {
                    MoneyText(value: repair.outstanding, size: 15)
                        .foregroundStyle(repair.owes ? Tokens.danger : Tokens.text)
                }
                if let parts = repair.partsCost {
                    FactRow(label: i18n.t("repairs.partsCost", default: "Parts cost")) { MoneyText(value: parts, size: 15) }
                }
                if let outside = repair.outsidePaid {
                    FactRow(label: i18n.t("repairs.outsidePaid", default: "Paid outside master")) { MoneyText(value: outside, size: 15) }
                }
                if let profit = repair.profit {
                    FactRow(label: i18n.t("repairs.profit", default: "Profit"), last: true) {
                        MoneyText(value: profit, size: 15).foregroundStyle(moneyTint(.profit, Double(profit)))
                    }
                }
            }
        }
    }
}

/// Who repairs it: our master, or the outside master (name + phone).
struct RepairMasterRow: View {
    let repair: RepairView
    @Environment(I18n.self) private var i18n

    var body: some View {
        if let m = repair.master {
            AppCard {
                VStack(spacing: 0) {
                    FactRow(label: i18n.t("repairs.master", default: "Master"), last: m.phone == nil) {
                        Text(m.isOutside ? "\(m.name) (\(i18n.t("repairs.outsideMaster", default: "outside")))" : m.name).font(.ui(.body))
                    }
                    if let phone = m.phone, !phone.isEmpty, let url = URL(string: "tel:\(phone)") {
                        FactRow(label: i18n.t("common.phone", default: "Phone"), last: true) {
                            Link(phone, destination: url).font(.ui(.bodyStrong)).foregroundStyle(Tokens.info)
                        }
                    }
                }
            }
        }
    }
}

/// The parts taken out of stock; each removable with `repair.manage`. Cost is
/// shown only when the server sent it.
struct RepairPartsSection: View {
    let repair: RepairView
    let canManage: Bool
    let onRemove: (String) -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        if !repair.parts.isEmpty {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(i18n.t("repairs.parts", default: "Parts")).font(.ui(.label)).foregroundStyle(Tokens.muted)
                AppCard {
                    VStack(spacing: 0) {
                        ForEach(repair.parts) { part in
                            HStack(spacing: Tokens.Space.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(part.name) × \(part.quantity)").font(.ui(.body)).foregroundStyle(Tokens.text)
                                    if let line = part.partLineCost {
                                        MoneyText(value: line, size: 13).foregroundStyle(Tokens.muted)
                                    }
                                }
                                Spacer(minLength: Tokens.Space.sm)
                                if canManage {
                                    Button { onRemove(part.id) } label: {
                                        Image(systemName: "xmark.circle.fill").foregroundStyle(Tokens.muted)
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel(i18n.t("common.clear", default: "Remove"))
                                }
                            }
                            .frame(minHeight: Tokens.Space.rowH)
                        }
                    }
                }
            }
        }
    }
}

/// Customer payments (and refunds, shown negative).
struct RepairPaymentsSection: View {
    let repair: RepairView
    @Environment(I18n.self) private var i18n

    var body: some View {
        if !repair.payments.isEmpty {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(i18n.t("repairs.payments", default: "Payments")).font(.ui(.label)).foregroundStyle(Tokens.muted)
                AppCard {
                    VStack(spacing: 0) {
                        ForEach(repair.payments) { p in
                            FactRow(label: "\(PaymentAccounts.label(p.accountCode, i18n)) · \(KitDate.day(p.occurredAt))",
                                    last: p.id == repair.payments.last?.id) {
                                MoneyText(value: p.amount, size: 14)
                                    .foregroundStyle(p.isRefund ? Tokens.danger : Tokens.success)
                            }
                        }
                    }
                }
            }
        }
    }
}

/// The warranty window once given back.
struct RepairWarrantyRow: View {
    let until: String
    let underWarranty: Bool
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            FactRow(label: i18n.t("repairs.warrantyUntil", default: "Warranty until"), last: true) {
                HStack(spacing: Tokens.Space.sm) {
                    Text(KitDate.day(until)).font(.data(.regular)).foregroundStyle(Tokens.text)
                    StatusBadge(underWarranty ? i18n.t("repairs.underWarranty", default: "Active")
                                              : i18n.t("repairs.warrantyExpired", default: "Expired"),
                                color: underWarranty ? Tokens.success : Tokens.muted)
                }
            }
        }
    }
}

/// The status history, newest last (as the server returns it).
struct RepairHistorySection: View {
    let repair: RepairView
    @Environment(I18n.self) private var i18n

    var body: some View {
        if !repair.statusHistory.isEmpty {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(i18n.t("repairs.history", default: "History")).font(.ui(.label)).foregroundStyle(Tokens.muted)
                AppCard {
                    VStack(spacing: 0) {
                        ForEach(repair.statusHistory) { h in
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: Tokens.Space.sm) {
                                    Text(RepairStatus.label(h.toStatusCode, i18n)).font(.ui(.body)).foregroundStyle(Tokens.text)
                                    Spacer(minLength: Tokens.Space.sm)
                                    Text(KitDate.day(h.changedAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                                }
                                if let note = h.note, !note.isEmpty {
                                    Text(note).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .frame(minHeight: Tokens.Space.rowH)
                        }
                    }
                }
            }
        }
    }
}
