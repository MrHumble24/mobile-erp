import SwiftUI

/// One partner row: name + contact, a credit-usage bar, outstanding balance and
/// open/overdue counts. Counts and the bar hide gracefully when the row came
/// from the offline mirror (which lacks them).
struct PartnerListRow: View {
    let partner: Partner
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(partner.shopName).font(.headline)
                if !partner.isActive {
                    StatusBadge(i18n.t("partners.inactive"), color: Tokens.slate)
                }
                Spacer()
                MoneyText(value: partner.outstanding, size: 15)
                    .foregroundStyle(Tokens.warning)
            }
            if let contact = contactLine { Text(contact).font(.caption).foregroundStyle(.secondary) }
            CreditBar(limit: partner.creditLimit, used: partner.outstanding)
            if let open = partner.openCount {
                HStack(spacing: 8) {
                    Text("\(open) \(i18n.t("partners.openCount"))")
                        .font(.caption).foregroundStyle(.secondary)
                    if let over = partner.overdueCount, over > 0 {
                        StatusBadge("\(over) \(i18n.t("partners.overdueCount"))", color: Tokens.danger)
                    }
                }
            }
        }
        .padding(.vertical, 4)
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
            Text(i18n.t("partners.creditUnlimited")).font(.caption2).foregroundStyle(.secondary)
        } else {
            let pct = min(1, max(0, usedN / limitN))
            VStack(spacing: 3) {
                HStack {
                    MoneyText(value: used, size: 11).foregroundStyle(.secondary)
                    Spacer()
                    MoneyText(value: limit, size: 11).foregroundStyle(.secondary)
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
