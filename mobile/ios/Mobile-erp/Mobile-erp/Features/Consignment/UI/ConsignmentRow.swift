import SwiftUI

/// One consignment card: status icon, partner, IMEI chip, agreed price, due date with
/// human-friendly date format & overdue badge, status pill, and settle/return actions for OUT items.
struct ConsignmentRow: View {
    let item: Consignment
    var onSettle: () -> Void
    var onReturn: () -> Void

    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header Row: Status Icon + Partner Name & IMEI + Status Badge
            HStack(alignment: .center, spacing: 12) {
                statusIcon
                    .frame(width: 42, height: 42)
                    .background(statusColor.opacity(0.12), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                VStack(alignment: .leading, spacing: 3) {
                    Text(item.partnerShopName)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(Tokens.ink)
                        .lineLimit(1)

                    HStack(spacing: 4) {
                        Image(systemName: "barcode.viewfinder")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.secondary)
                        Text(item.imei)
                            .font(.mono(12, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                    if let imei2 = item.imei2, !imei2.isEmpty {
                        Text("\(i18n.t("inventory.imei2", default: "IMEI 2")): \(imei2)")
                            .font(.mono(11, weight: .medium))
                            .foregroundStyle(.tertiary)
                    }
                }

                Spacer()

                HStack(spacing: 8) {
                    statusBadge

                    Image(systemName: "chevron.right")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Color(.tertiaryLabel))
                }
            }

            // Metrics Box: Due date & Agreed price with clear visual hierarchy
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(i18n.t("consignments.dueDate", default: "Muddati"))
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    HStack(spacing: 5) {
                        Image(systemName: "calendar")
                            .font(.caption)
                            .foregroundStyle(overdue > 0 ? Tokens.danger : .secondary)
                        Text(formattedDate(item.dueDate))
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(overdue > 0 ? Tokens.danger : Tokens.ink)

                        if overdue > 0 {
                            Text("\(overdue)d")
                                .font(.caption2.weight(.bold))
                                .foregroundStyle(Tokens.danger)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Tokens.badBg, in: Capsule())
                        }
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(i18n.t("consignments.agreedPrice", default: "Kelishilgan narx"))
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    MoneyText(value: item.agreedPrice, size: 17)
                        .foregroundStyle(Tokens.ink)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Tokens.surface, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).strokeBorder(Tokens.hairline, lineWidth: 1))

            // Notes if provided
            if let notes = item.notes, !notes.trimmingCharacters(in: .whitespaces).isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "text.bubble")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(notes)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }

            // Direct action buttons for OUT items
            if item.isOut {
                HStack(spacing: 10) {
                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        onSettle()
                    } label: {
                        Label(i18n.t("consignments.settle", default: "Settle Sale"), systemImage: "checkmark.circle.fill")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Tokens.success)
                    .buttonBorderShape(.capsule)

                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        onReturn()
                    } label: {
                        Label(i18n.t("consignments.return", default: "Return"), systemImage: "arrow.uturn.backward")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                    }
                    .buttonStyle(.bordered)
                    .tint(Tokens.danger)
                    .buttonBorderShape(.capsule)
                }
                .buttonStyle(.borderless)
                .padding(.top, 2)
            }
        }
        .padding(.vertical, 4)
    }

    private var overdue: Int {
        ConsignmentLogic.daysOverdue(dueDate: item.dueDate, statusCode: item.statusCode)
    }

    private var statusIcon: some View {
        Group {
            switch item.statusCode {
            case "OUT":
                Image(systemName: "shippingbox.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Tokens.signalBlue)
            case "SETTLED":
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Tokens.success)
            case "RETURNED":
                Image(systemName: "arrow.uturn.backward.circle.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Tokens.slate)
            default:
                Image(systemName: "doc.text")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(Tokens.slate)
            }
        }
    }

    private var statusColor: Color {
        switch item.statusCode {
        case "OUT": return Tokens.signalBlue
        case "SETTLED": return Tokens.success
        case "RETURNED": return Tokens.slate
        default: return Tokens.slate
        }
    }

    private var statusBadge: some View {
        let label = {
            switch item.statusCode {
            case "OUT": return i18n.t("consignments.statusOut")
            case "SETTLED": return i18n.t("consignments.statusSettled")
            case "RETURNED": return i18n.t("consignments.statusReturned")
            default: return item.statusCode
            }
        }()
        return StatusBadge(label, color: statusColor)
    }

    private func formattedDate(_ raw: String) -> String {
        let clean = String(raw.prefix(10))
        let parts = clean.split(separator: "-")
        guard parts.count == 3 else { return clean }
        let year = parts[0]
        let month = parts[1]
        let day = parts[2]
        let monthNames = [
            "01": "yan", "02": "fev", "03": "mar", "04": "apr", "05": "may", "06": "iyn",
            "07": "iyl", "08": "avg", "09": "sen", "10": "okt", "11": "noy", "12": "dek"
        ]
        if let m = monthNames[String(month)] {
            return "\(day)-\(m), \(year)"
        }
        return clean
    }
}
