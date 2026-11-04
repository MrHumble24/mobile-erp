import SwiftUI

/// Slice-local Warm Card pieces shared by the consignment and partner screens:
/// status hue/label, the sheet title row, the surface-2 subject block, keyed
/// fact rows, the credit bar and a kit-styled date control.
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

/// Sheet title + the 44 pt close circle (same chrome as the QC/model sheets).
struct SheetTitleRow: View {
    @Environment(I18n.self) private var i18n
    let title: String
    let onClose: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: Tokens.Space.sm) {
            Text(title).font(.ui(.title)).foregroundStyle(Tokens.text)
            Spacer(minLength: Tokens.Space.sm)
            Button(action: onClose) {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Tokens.text)
                    .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                    .background(Tokens.surface2, in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(i18n.t("common.close"))
        }
    }
}

/// The subject of a write sheet: a surface-2 block, never a card nested in the sheet.
struct SubjectBlock<Trailing: View>: View {
    let title: String
    let line: String
    var mono = true
    @ViewBuilder var trailing: () -> Trailing

    init(title: String, line: String, mono: Bool = true, @ViewBuilder trailing: @escaping () -> Trailing = { EmptyView() }) {
        self.title = title
        self.line = line
        self.mono = mono
        self.trailing = trailing
    }

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                Text(line).font(mono ? .data(.regular) : .ui(.body)).foregroundStyle(Tokens.text)
            }
            Spacer(minLength: 0)
            trailing()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Tokens.Space.lg)
        .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous))
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

/// A date control in the kit's field chrome (card fill, hairline, 52 pt).
struct NasiyaDateField: View {
    @Binding var date: Date

    var body: some View {
        HStack(spacing: Tokens.Space.sm) {
            Image(systemName: "calendar").foregroundStyle(Tokens.muted)
            DatePicker("", selection: $date, displayedComponents: .date)
                .labelsHidden()
                .tint(Tokens.action)
            Spacer(minLength: 0)
        }
        .frame(height: Tokens.Space.controlH)
        .padding(.horizontal, Tokens.Space.lg)
        .background(RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous).fill(Tokens.card))
        .overlay(RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous).strokeBorder(Tokens.border, lineWidth: 1))
    }
}

/// Inline error line under a form; also used for the offline notice.
struct FormErrorLine: View {
    let message: String
    var color: Color = Tokens.danger

    var body: some View {
        Text(message).font(.ui(.caption)).foregroundStyle(color)
    }
}
