import SwiftUI

/// One editable cart line as a Warm Card. A **unit** line shows sale price,
/// warranty days and notes; a **quantity product** line (ADR 0030) shows a
/// quantity stepper, price per piece, the line total and an over-stock warning.
struct PosCartLineRow: View {
    let cart: PosCart
    let line: PosCartLine
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                header
                if line.isProduct { productFields } else { unitFields }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                Text(line.modelLabel).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                if !line.code.isEmpty {
                    Text(line.code).font(.data(.regular)).foregroundStyle(Tokens.muted)
                }
            }
            Spacer(minLength: Tokens.Space.md)
            Button(role: .destructive) { cart.remove(line.id) } label: {
                Image(systemName: "trash").foregroundStyle(Tokens.muted)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(i18n.t("pos.removeLine"))
        }
    }

    // MARK: Unit line

    private var unitFields: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
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

    // MARK: Quantity product line

    private var productFields: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            HStack(alignment: .bottom, spacing: Tokens.Space.md) {
                AppFormField(label: i18n.t("catalog.quantity")) { stepper }
                AppFormField(label: i18n.t("catalog.unitPrice")) {
                    AppTextField(placeholder: i18n.t("catalog.unitPrice"), text: price,
                                 keyboard: .decimalPad, font: .mono(15, weight: .medium))
                        .sanitizeDecimal(price)
                }
            }
            HStack {
                Text(i18n.t("catalog.lineTotal")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer()
                MoneyText(value: NSDecimalNumber(decimal: line.lineTotal).stringValue, size: 15)
                    .foregroundStyle(Tokens.text)
            }
            if line.exceedsStock {
                Label(i18n.t("catalog.belowZero"), systemImage: "exclamationmark.triangle")
                    .font(.ui(.caption)).foregroundStyle(Tokens.warning)
            }
        }
    }

    private var stepper: some View {
        HStack(spacing: Tokens.Space.md) {
            stepButton("minus") { cart.setQuantity(line.id, line.quantity - 1) }
            Text("\(line.quantity)").font(.data(.regular)).foregroundStyle(Tokens.text)
                .frame(minWidth: 32)
            stepButton("plus") { cart.setQuantity(line.id, line.quantity + 1) }
        }
    }

    private func stepButton(_ symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Tokens.text)
                .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                .background(Tokens.surface2, in: Circle())
        }
        .buttonStyle(.plain)
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
