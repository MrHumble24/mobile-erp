import SwiftUI

/// One consignment row: partner, IMEI (mono), agreed price, due date with a
/// days-overdue flag, status badge, and settle/return actions for OUT items.
struct ConsignmentRow: View {
    let item: Consignment
    var onSettle: () -> Void
    var onReturn: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(item.partnerShopName).font(.headline)
                Spacer()
                statusBadge
            }
            HStack {
                Text(item.imei).font(.mono(13)).foregroundStyle(.secondary)
                Spacer()
                MoneyText(value: item.agreedPrice, size: 15)
            }
            dueLine
            if item.isOut { actions }
        }
        .padding(.vertical, 4)
    }

    private var overdue: Int {
        ConsignmentLogic.daysOverdue(dueDate: item.dueDate, statusCode: item.statusCode)
    }

    private var dueLine: some View {
        HStack(spacing: 6) {
            Text(item.dueDate.prefix(10)).font(.caption).foregroundStyle(.secondary)
            if overdue > 0 {
                Text("\(overdue) \(i18n.t("consignments.daysOverdue"))")
                    .font(.caption.weight(.semibold)).foregroundStyle(Tokens.danger)
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
        HStack {
            Button { onSettle() } label: {
                Label(i18n.t("consignments.settle"), systemImage: "checkmark.circle")
            }
            .buttonStyle(.borderedProminent).controlSize(.small)
            Button { onReturn() } label: {
                Label(i18n.t("consignments.return"), systemImage: "arrow.uturn.backward")
            }
            .buttonStyle(.bordered).controlSize(.small).tint(Tokens.danger)
        }
        .padding(.top, 2)
    }
}
