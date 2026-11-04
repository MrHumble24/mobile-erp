import SwiftUI

/// Slice-local Warm Card pieces shared by the consignment and partner screens:
/// status hue/label, and the credit bar. The sheet
/// chrome (`SheetTitleRow`, `SubjectBlock`, `FormErrorLine`) and `FactRow`
/// live in `Shared/UI`.
enum ConsignmentStatus {
    static func color(_ code: String) -> Color {
        switch code {
        case "OUT": return Tokens.info
        case "SETTLED": return Tokens.success
        case "RETURNED": return Tokens.sold
        default: return Tokens.muted
        }
    }

    static func label(_ code: String, _ t: (String) -> String) -> String {
        switch code {
        case "OUT": return t("consignments.statusOut")
        case "SETTLED": return t("consignments.statusSettled")
        case "RETURNED": return t("consignments.statusReturned")
        default: return code
        }
    }
}

/// Outstanding-vs-limit bar on the border track; "unlimited" when there is no limit.
struct CreditBar: View {
    @Environment(I18n.self) private var i18n
    let limit: String
    let used: String

    var body: some View {
        let limitN = Double(limit) ?? 0
        let usedN = Double(used) ?? 0
        if limitN <= 0 {
            Text(i18n.t("partners.creditUnlimited")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
        } else {
            let pct = min(1, max(0, usedN / limitN))
            VStack(spacing: Tokens.Space.xs) {
                HStack {
                    MoneyText(value: used, size: 12).foregroundStyle(Tokens.muted)
                    Spacer()
                    MoneyText(value: limit, size: 12).foregroundStyle(Tokens.muted)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Tokens.border)
                        Capsule().fill(pct >= 0.9 ? Tokens.danger : pct >= 0.7 ? Tokens.warning : Tokens.success)
                            .frame(width: geo.size.width * pct)
                    }
                }
                .frame(height: 6)
            }
        }
    }
}
