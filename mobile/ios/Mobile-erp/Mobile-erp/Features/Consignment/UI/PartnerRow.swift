import SwiftUI

/// One partner row: name + contact, a credit-usage bar, outstanding balance and
/// open/overdue counts. Counts and the bar hide gracefully when the row came
/// from the offline mirror (which lacks them).
struct PartnerListRow: View {
    let partner: Partner
    @Environment(I18n.self) private var i18n

    var body: some View {
        let outstandingVal = Double(partner.outstanding) ?? 0
        let hasOverdue = (partner.overdueCount ?? 0) > 0

        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text(partner.shopName)
                            .font(.headline)
                            .foregroundStyle(Tokens.ink)
                        if !partner.isActive {
                            StatusBadge(i18n.t("partners.inactive", default: "Inactive"), color: Tokens.slate)
                        }
                    }
                    if let contact = contactLine {
                        Text(contact)
                            .font(.caption)
                            .foregroundStyle(Tokens.muted)
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    MoneyText(value: partner.outstanding, size: 17)
                        .foregroundStyle(outstandingVal > 0 ? (hasOverdue ? Tokens.danger : Tokens.warning) : Tokens.ink)
                    if outstandingVal > 0 {
                        Text(i18n.t("partners.balanceDue", default: "Balance Due"))
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(hasOverdue ? Tokens.danger : .secondary)
                    }
                }
            }
            CreditBar(limit: partner.creditLimit, used: partner.outstanding)
            if let open = partner.openCount {
                HStack(spacing: 8) {
                    Text("\(open) \(i18n.t("partners.openCount", default: "devices out"))")
                        .font(.caption).foregroundStyle(Tokens.muted)
                    if let over = partner.overdueCount, over > 0 {
                        StatusBadge("\(over) \(i18n.t("partners.overdueCount", default: "overdue"))", color: Tokens.danger)
                    }
                }
            }
        }
        .padding(.vertical, 6)
    }

    private var contactLine: String? {
        let parts = [partner.contactPerson, partner.phone.map { "(\($0))" }].compactMap { $0 }
        let line = parts.joined(separator: " ")
        return line.isEmpty ? nil : line
    }
}

/// Credit utilisation bar; "unlimited" when the limit is zero.
private struct CreditBar: View {
    let limit: String
    let used: String
    @Environment(I18n.self) private var i18n

    var body: some View {
        let limitN = Double(limit) ?? 0
        let usedN = Double(used) ?? 0
        if limitN <= 0 {
            Text(i18n.t("partners.creditUnlimited")).font(.caption2).foregroundStyle(Tokens.muted)
        } else {
            let pct = min(1, max(0, usedN / limitN))
            VStack(spacing: 3) {
                HStack {
                    MoneyText(value: used, size: 11).foregroundStyle(Tokens.muted)
                    Spacer()
                    MoneyText(value: limit, size: 11).foregroundStyle(Tokens.muted)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Tokens.hairline)
                        Capsule().fill(barColor(pct)).frame(width: geo.size.width * pct)
                    }
                }
                .frame(height: 5)
            }
        }
    }

    private func barColor(_ pct: Double) -> Color {
        pct >= 0.9 ? Tokens.danger : pct >= 0.7 ? Tokens.warning : Tokens.success
    }
}
