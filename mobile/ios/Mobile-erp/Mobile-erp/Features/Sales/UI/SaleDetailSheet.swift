import SwiftUI

/// Detail for one sale as a Warm Card sheet: the device block (model, IMEIs with
/// copy, channel / returned pills), keyed facts, then the actions. Links to the
/// printable receipt and the return flow. Cost/profit rows appear only when the
/// server included them (redacted for under-privileged users).
struct SaleDetailSheet: View {
    let sale: SaleView
    let onChanged: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var showReceipt = false
    @State private var showReturn = false

    private var canReturn: Bool { container.session.can("sale.return") && !sale.isReturned }

    /// The refund ceiling: what was tendered (sum of payment lines), or the sale
    /// price when there are no tender lines — mirrors the server cap (ADR 0028). A
    /// credit sale's return hands back no cash (ADR 0035), so its cap is zero.
    private var maxRefund: Decimal {
        if sale.isCredit { return 0 }
        if let lines = sale.payments, !lines.isEmpty {
            return lines.reduce(.zero) { $0 + (Decimal(string: $1.amount.string) ?? .zero) }
        }
        return Decimal(string: sale.salePrice.string) ?? .zero
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.gutter) {
                header
                facts
                actions
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollBounceBehavior(.basedOnSize)
        .background(Tokens.card)
        .sheet(isPresented: $showReceipt) { ReceiptSheet(saleId: sale.id, payments: sale.payments ?? []) }
        .sheet(isPresented: $showReturn) {
            ReturnSheet(saleId: sale.id, payments: sale.payments ?? [], maxRefund: maxRefund, isQuantity: sale.isQuantitySale, isCredit: sale.isCredit) {
                container.toasts.success(i18n.t("sales.returnSuccess"))
                onChanged()
                dismiss()
            }
        }
        #if DEBUG
        // `-openSaleReturn 1` / `-openSaleReceipt 1` open the return / receipt
        // sheet for screenshots.
        .task {
            if KitDebugLaunch.consume("openSaleReceipt") != nil { showReceipt = true }
            if canReturn, KitDebugLaunch.consume("openSaleReturn") != nil { showReturn = true }
        }
        #endif
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                Text(sale.modelLabel)
                    .font(.ui(.title))
                    .foregroundStyle(Tokens.text)
                Spacer(minLength: Tokens.Space.sm)
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Tokens.text)
                        .frame(width: Tokens.Space.minTouch, height: Tokens.Space.minTouch)
                        .background(Tokens.surface2, in: Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel(i18n.t("common.close"))
            }
            if !sale.unitCode.isEmpty {
                CopyableIMEI(label: i18n.t("catalog.unitCode"), value: sale.unitCode, accessibilityLabel: i18n.t("inventory.copyImei"))
            }
            if sale.isQuantitySale {
                Text(sale.quantityLabel)
                    .font(.data(.large))
                    .foregroundStyle(Tokens.text)
            }
            if let imei2 = sale.device?.imei2, !imei2.isEmpty {
                CopyableIMEI(label: i18n.t("inventory.imei2"), value: imei2, accessibilityLabel: i18n.t("inventory.copyImei"))
            }
            HStack(spacing: Tokens.Space.sm) {
                StatusBadge(sale.isB2B ? i18n.t("sales.channelB2B") : i18n.t("sales.channelRetail"),
                            color: sale.isB2B ? Tokens.warning : Tokens.info)
                if sale.isCredit { StatusBadge(i18n.t("credit.title"), color: Tokens.action) }
                if sale.isReturned { StatusBadge(i18n.t("sales.returned"), color: Tokens.danger) }
            }
        }
    }

    private var facts: some View {
        VStack(spacing: 0) {
            if sale.showsPricing {
                if sale.priceLevelCode != nil && sale.priceLevelCode != PriceLevels.retail {
                    fact(i18n.t("pricing.priceLevel")) {
                        Text(i18n.t(PriceLevels.labelKey(sale.priceLevelCode!))).font(.ui(.body))
                    }
                }
                if let listPrice = sale.listPrice {
                    fact(i18n.t("pricing.listPrice")) {
                        MoneyText(value: listPrice.string, size: 15).foregroundStyle(Tokens.muted)
                    }
                }
                if let discount = sale.discountAmount, (Decimal(string: discount.string) ?? 0) > 0 {
                    fact(i18n.t("pricing.discount")) {
                        Text("− \(MoneyText.format(discount.string))").font(.data(.regular))
                            .foregroundStyle(Tokens.success)
                    }
                }
            }
            fact(i18n.t("sales.salePrice")) {
                MoneyText(value: sale.salePrice.string, size: 15).foregroundStyle(Tokens.text)
            }
            if let payments = sale.payments, !payments.isEmpty {
                fact(i18n.t("balance.paidWith")) {
                    VStack(alignment: .trailing, spacing: 2) {
                        ForEach(payments) { p in
                            HStack(spacing: Tokens.Space.sm) {
                                Text(PaymentAccounts.label(p.accountCode, i18n))
                                    .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                                MoneyText(value: p.amount.string, size: 14).foregroundStyle(Tokens.text)
                            }
                        }
                    }
                }
            }
            if let net = sale.netProfit {
                fact(i18n.t("sales.netProfit")) {
                    MoneyText(value: net.string, size: 15)
                        .foregroundStyle(moneyTint(.profit, Double(net.string)))
                }
            }
            if let customer = sale.customer {
                fact(i18n.t("sales.customer")) { Text(customer.name).font(.ui(.body)) }
                if let phone = customer.phone, !phone.isEmpty, let url = URL(string: "tel:\(phone)") {
                    fact(i18n.t("common.phone")) {
                        Link(phone, destination: url).font(.ui(.bodyStrong)).foregroundStyle(Tokens.info)
                    }
                }
            }
            fact(i18n.t("sales.soldBy")) { Text(sale.soldBy.name).font(.ui(.body)) }
            fact(i18n.t("sales.soldAt")) { Text(SaleDate.dayTime(sale.soldAt)).font(.data(.regular)) }
            if let warranty = sale.warranty {
                fact(i18n.t("pos.warrantyDays")) { Text("\(warranty.days)").font(.data(.regular)) }
            }
            if let returnedAt = sale.returnedAt {
                fact(i18n.t("sales.returnedAt")) { Text(SaleDate.dayTime(returnedAt)).font(.data(.regular)) }
            }
        }
    }

    /// Keyed row: muted label left, value right, hairline below.
    private func fact<V: View>(_ label: String, @ViewBuilder value: () -> V) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: Tokens.Space.sm) {
                Text(label).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer(minLength: Tokens.Space.sm)
                value().foregroundStyle(Tokens.text)
            }
            .frame(minHeight: Tokens.Space.rowH)
            Divider().overlay(Tokens.border)
        }
    }

    private var actions: some View {
        VStack(spacing: Tokens.Space.sm) {
            if !sale.unitCode.isEmpty {
                pill(i18n.t("sales.openDevice"), .pillGhost) {
                    container.router.open(.inventory(imei: sale.unitCode))
                    dismiss()
                }
            }
            if let consignmentId = sale.consignmentId {
                pill(i18n.t("sales.viewConsignment"), .pillGhost) {
                    container.router.open(.consignments(id: consignmentId))
                    dismiss()
                }
            }
            pill(i18n.t("sales.receipt"), .pillSecondary) { showReceipt = true }
            if canReturn {
                pill(i18n.t("sales.returnDevice"), .pillDestructive) { showReturn = true }
            }
        }
    }

    /// Full-width pill: the frame sits on the label so the fill spans the sheet.
    private func pill(_ title: String, _ style: PillButton, action: @escaping () -> Void) -> some View {
        Button(action: action) { Text(title).frame(maxWidth: .infinity) }
            .buttonStyle(style)
    }
}
