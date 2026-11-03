import SwiftUI

/// One editable cart line: device + IMEI header, sale price, warranty days,
/// optional notes, and a remove button. Edits write back through the cart so a
/// struct line stays the single source of truth.
struct PosCartLineRow: View {
    let cart: PosCart
    let line: PosCartLine
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(line.device.modelLabel).font(.body.weight(.medium))
                    Text(line.device.imei).font(.mono(12)).foregroundStyle(.secondary)
                }
                Spacer()
                Button(role: .destructive) {
                    cart.remove(line.id)
                } label: {
                    Image(systemName: "trash")
                }
                .buttonStyle(.borderless)
                .accessibilityLabel(i18n.t("pos.removeLine"))
            }
            HStack(spacing: 12) {
                TextField(i18n.t("pos.salePrice"), text: price)
                    .keyboardType(.decimalPad)
                    .font(.mono(15))
                    .sanitizeDecimal(price)
                TextField(i18n.t("pos.warrantyDays"), text: warranty)
                    .keyboardType(.numberPad)
                    .frame(width: 110)
                    .sanitizeDigits(warranty)
            }
            TextField(i18n.t("pos.notes"), text: notes, axis: .vertical)
                .lineLimit(1...2)
                .font(.subheadline)
        }
        .padding(.vertical, 4)
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
