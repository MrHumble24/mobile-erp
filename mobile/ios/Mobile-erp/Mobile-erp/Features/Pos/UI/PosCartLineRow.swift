import SwiftUI

/// One editable cart line as a Warm Card: device + mono IMEI header with a
/// remove button, then sale price, warranty days and optional notes. Edits write
/// back through the cart so a struct line stays the single source of truth.
struct PosCartLineRow: View {
    let cart: PosCart
    let line: PosCartLine
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                        Text(line.device.modelLabel)
                            .font(.ui(.bodyStrong))
                            .foregroundStyle(Tokens.text)
                        Text(line.device.code)
                            .font(.data(.regular))
                            .foregroundStyle(Tokens.muted)
                    }
                    Spacer(minLength: Tokens.Space.md)
                    Button(role: .destructive) { cart.remove(line.id) } label: {
                        Image(systemName: "trash").foregroundStyle(Tokens.muted)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(i18n.t("pos.removeLine"))
                }
                HStack(alignment: .bottom, spacing: Tokens.Space.md) {
                    AppFormField(label: i18n.t("pos.salePrice")) {
                        AppTextField(placeholder: i18n.t("pos.salePrice"), text: price,
                                     keyboard: .decimalPad, font: .mono(15, weight: .medium))
                            .sanitizeDecimal(price)
                    }
                    AppFormField(label: i18n.t("pos.warrantyDays")) {
                        AppTextField(placeholder: i18n.t("pos.warrantyDays"), text: warranty,
                                     keyboard: .numberPad, font: .mono(15, weight: .medium))
                            .sanitizeDigits(warranty)
                    }
                    .frame(width: 120)
                }
                AppFormField(label: i18n.t("pos.notes")) {
                    AppTextField(placeholder: i18n.t("pos.notes"), text: notes)
                }
            }
        }
    }

    private var price: Binding<String> {
        Binding(get: { line.price }, set: { cart.setPrice(line.id, $0.sanitizedDecimal) })
    }
    private var warranty: Binding<String> {
        Binding(get: { line.warrantyDays }, set: { cart.setWarranty(line.id, $0.sanitizedDigits) })
    }
    private var notes: Binding<String> {
        Binding(get: { line.notes }, set: { cart.setNotes(line.id, $0) })
    }
}
