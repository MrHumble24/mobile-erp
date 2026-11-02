import SwiftUI

/// One consignment row: partner, IMEI (mono), agreed price, due date with a
/// days-overdue flag, status badge, and settle/return actions for OUT items.
struct ConsignmentRow: View {
    let item: Consignment
    var onSettle: () -> Void
    var onReturn: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.partnerShopName)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(Tokens.ink)

                    HStack(spacing: 6) {
                        Text(item.imei)
                            .font(.mono(12, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                statusBadge
            }

            HStack(alignment: .bottom) {
                dueLine
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(i18n.t("consignments.agreedPrice", default: "Agreed"))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    MoneyText(value: item.agreedPrice, size: 16)
                        .foregroundStyle(Tokens.ink)
                }
            }

            if item.isOut {
                Divider().padding(.vertical, 2)
                actions
            }
        }
        .padding(.vertical, 6)
    }

    private var overdue: Int {
        ConsignmentLogic.daysOverdue(dueDate: item.dueDate, statusCode: item.statusCode)
    }

    private var dueLine: some View {
        HStack(spacing: 6) {
            Image(systemName: "calendar")
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(item.dueDate.prefix(10))
                .font(.caption)
                .foregroundStyle(.secondary)

            if overdue > 0 {
                HStack(spacing: 3) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.system(size: 10))
                    Text("\(overdue) \(i18n.t("consignments.daysOverdue", default: "d overdue"))")
                        .font(.caption2.weight(.bold))
                }
                .foregroundStyle(Tokens.danger)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Tokens.danger.opacity(0.12), in: Capsule())
            }
        }
    }

    private var statusBadge: some View {
        let (label, color): (String, Color) = {
            switch item.statusCode {
            case "OUT": return (i18n.t("consignments.statusOut"), Tokens.signalBlue)
            case "SETTLED": return (i18n.t("consignments.statusSettled"), Tokens.success)
            case "RETURNED": return (i18n.t("consignments.statusReturned"), Tokens.slate)
            default: return (item.statusCode, Tokens.slate)
            }
        }()
        return StatusBadge(label, color: color)
    }

    private var actions: some View {
        HStack(spacing: 10) {
            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                onSettle()
            } label: {
                Label(i18n.t("consignments.settle", default: "Settle Sale"), systemImage: "checkmark.circle.fill")
                    .font(.caption.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
            }
            .buttonStyle(.borderedProminent)
            .tint(Tokens.success)
            .buttonBorderShape(.capsule)

            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                onReturn()
            } label: {
                Label(i18n.t("consignments.return", default: "Return"), systemImage: "arrow.uturn.backward")
                    .font(.caption.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
            }
            .buttonStyle(.bordered)
            .tint(Tokens.danger)
            .buttonBorderShape(.capsule)
        }
        .buttonStyle(.borderless)
    }
}
