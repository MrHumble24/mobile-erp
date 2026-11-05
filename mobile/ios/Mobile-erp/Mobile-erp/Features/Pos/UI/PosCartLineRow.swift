import SwiftUI

/// One editable cart line as a Warm Card (ADR 0030/0034). When the line has a
/// list price for the current level the price is not typed — it shows the list
/// price, the discount and the final price; a `sale.price.override` user may
/// switch to typing a free price. A line with no list price keeps the old
/// behaviour (the seller types the price). Quantity lines add a stepper.
struct PosCartLineRow: View {
    let cart: PosCart
    let line: PosCartLine
    @Environment(I18n.self) private var i18n
    @State private var showDiscount = false

    private var list: Decimal? { cart.listPrice(line) }
    private var hasList: Bool { list != nil && !line.priceOverridden }
    private var discount: Decimal { cart.discountAmount(line) }
    private var errorKey: String? { cart.validationErrorKey(line) }

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                header
                if line.isProduct { quantityRow }
                priceSection
                if !line.isProduct { unitExtras }
                if line.isProduct, line.exceedsStock {
                    Label(i18n.t("catalog.belowZero"), systemImage: "exclamationmark.triangle")
                        .font(.ui(.caption)).foregroundStyle(Tokens.warning)
                }
            }
        }
        .sheet(isPresented: $showDiscount) {
            PosDiscountSheet(
                title: i18n.t("pricing.discountOnLine"), list: list ?? 0, config: cart.config,
                cap: PricingMath.cap(cashierMax: cart.config.cashierMax, standing: cart.standingPercent),
                initialMode: line.discountMode, initialValue: line.discountValue,
                onApply: { cart.setDiscount(line.id, mode: $0, value: $1) },
                onClear: { cart.clearDiscount(line.id) })
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

    // MARK: Price

    @ViewBuilder private var priceSection: some View {
        if hasList {
            listPricedRow
            if cart.config.enabled { discountButton }
            if let errorKey { errorLine(errorKey) }
            if cart.config.canOverridePrice { overrideToggle }
        } else {
            typedPriceField
            if line.priceOverridden { revertOverride }
        }
    }

    /// List-priced: list (struck when discounted) and the final price.
    private var listPricedRow: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text(i18n.t("pricing.listPrice")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Text(MoneyText.format(NSDecimalNumber(decimal: list ?? 0).stringValue))
                    .font(.mono(14))
                    .foregroundStyle(Tokens.muted)
                    .strikethrough(discount > 0, color: Tokens.muted)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(i18n.t("pricing.finalPrice")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                MoneyText(value: NSDecimalNumber(decimal: cart.finalTotal(line)).stringValue, size: 17)
                    .fontWeight(.semibold).foregroundStyle(Tokens.text)
            }
        }
    }

    private var discountButton: some View {
        Button { showDiscount = true } label: {
            Label(discountLabel, systemImage: "percent").frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillSecondary)
    }

    private var discountLabel: String {
        guard discount > 0 else { return i18n.t("pricing.discount") }
        return "− \(MoneyText.format(NSDecimalNumber(decimal: discount).stringValue))"
    }

    private var overrideToggle: some View {
        Button(i18n.t("pricing.priceOverride")) { cart.overridePrice(line.id, line.price) }
            .buttonStyle(.pillGhost)
    }

    private var revertOverride: some View {
        Button(i18n.t("pricing.listPrice")) { cart.clearOverride(line.id) }
            .buttonStyle(.pillGhost)
    }

    private var typedPriceField: some View {
        AppFormField(label: line.isProduct ? i18n.t("catalog.unitPrice") : i18n.t("pos.salePrice")) {
            AppTextField(placeholder: i18n.t("pos.salePrice"), text: price,
                         keyboard: .decimalPad, font: .mono(15, weight: .medium))
                .sanitizeDecimal(price)
            if line.isProduct {
                HStack {
                    Text(i18n.t("catalog.lineTotal")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    Spacer()
                    MoneyText(value: NSDecimalNumber(decimal: cart.finalTotal(line)).stringValue, size: 15)
                        .foregroundStyle(Tokens.text)
                }
            }
        }
    }

    // MARK: Quantity + unit extras

    private var quantityRow: some View {
        AppFormField(label: i18n.t("catalog.quantity")) {
            HStack(spacing: Tokens.Space.md) {
                stepButton("minus") { cart.setQuantity(line.id, line.quantity - 1) }
                Text("\(line.quantity)").font(.data(.regular)).foregroundStyle(Tokens.text).frame(minWidth: 32)
                stepButton("plus") { cart.setQuantity(line.id, line.quantity + 1) }
            }
        }
    }

    private var unitExtras: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            AppFormField(label: i18n.t("pos.warrantyDays")) {
                AppTextField(placeholder: i18n.t("pos.warrantyDays"), text: warranty,
                             keyboard: .numberPad, font: .mono(15, weight: .medium))
                    .sanitizeDigits(warranty)
            }
            AppFormField(label: i18n.t("pos.notes")) {
                AppTextField(placeholder: i18n.t("pos.notes"), text: notes)
            }
        }
    }

    private func stepButton(_ symbol: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 15, weight: .semibold)).foregroundStyle(Tokens.text)
                .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                .background(Tokens.surface2, in: Circle())
        }
        .buttonStyle(.plain)
    }

    private func errorLine(_ key: String) -> some View {
        Text(key == "pricing.errorDiscountTooHigh"
             ? i18n.t(key, ["max": NSDecimalNumber(decimal: PricingMath.cap(cashierMax: cart.config.cashierMax, standing: cart.standingPercent)).stringValue])
             : i18n.t(key))
            .font(.ui(.caption)).foregroundStyle(Tokens.danger)
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
