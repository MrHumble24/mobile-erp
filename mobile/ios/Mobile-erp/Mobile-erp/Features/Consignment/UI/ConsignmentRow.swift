import SwiftUI

/// One consignment card: partner, mono IMEI(s), due date (danger when overdue)
/// left; mono price and status pill right; settle / return as quiet pills on an
/// OUT row. The one orange stays on the screen's new-consignment action.
struct ConsignmentRow: View {
    let item: Consignment
    var onOpen: () -> Void
    var onSettle: () -> Void
    var onReturn: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                HStack(alignment: .top, spacing: Tokens.Space.sm) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.partnerShopName.isEmpty ? "—" : item.partnerShopName)
                            .font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                        Text(item.imei).font(.data(.regular)).foregroundStyle(Tokens.text)
                        if let imei2 = item.imei2, !imei2.isEmpty {
                            Text(imei2).font(.data(.regular)).foregroundStyle(Tokens.muted)
                        }
                        Text(dueLine).font(.ui(.caption)).foregroundStyle(overdue > 0 ? Tokens.danger : Tokens.muted)
                    }
                    Spacer(minLength: Tokens.Space.sm)
                    VStack(alignment: .trailing, spacing: Tokens.Space.xs) {
                        MoneyText(value: item.agreedPrice, size: 15).fontWeight(.semibold).foregroundStyle(Tokens.text)
                        StatusBadge(ConsignmentStatus.label(item.statusCode) { i18n.t($0) },
                                    color: ConsignmentStatus.color(item.statusCode))
                    }
                }
                if item.isOut {
                    HStack(spacing: Tokens.Space.sm) {
                        Button { Haptic.tick.play(); onSettle() } label: {
                            Text(i18n.t("consignments.settle")).frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.pillSecondary)
                        Button { Haptic.tick.play(); onReturn() } label: {
                            Text(i18n.t("consignments.return")).frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.pillSecondary)
                    }
                }
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onOpen)
    }

    private var overdue: Int {
        ConsignmentLogic.daysOverdue(dueDate: item.dueDate, statusCode: item.statusCode)
    }

    private var dueLine: String {
        let day = KitDate.day(item.dueDate)
        return overdue > 0
            ? "\(day) · \(overdue) \(i18n.t("consignments.daysOverdue"))"
            : "\(i18n.t("consignments.dueDate")): \(day)"
    }
}
