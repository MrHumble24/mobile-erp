import SwiftUI

/// 58mm printable receipt for one sale. Fetches the server `ReceiptView` (no
/// cost/profit, ever) and renders it monospaced. Copy + system print both work.
struct ReceiptSheet: View {
    let saleId: String
    /// Tender lines from the sale view; the server receipt has no payments, so
    /// they ride in from the detail. Empty → the paid-with block is hidden.
    var payments: [SalePaymentLine] = []
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var receipt: ReceiptView?
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if let receipt {
                    ScrollView {
                        VStack(spacing: 16) {
                            AppCard { paper(receipt) }
                            actions(receipt)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 20)
                        .frame(maxWidth: .infinity)
                    }
                    .background(Tokens.bg)
                } else if let error {
                    ErrorStateView(message: error) { load() }
                } else {
                    LoadingView()
                }
            }
            .navigationTitle(i18n.t("sales.receipt"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
            .task { if receipt == nil { load() } }
        }
    }

    private func paper(_ r: ReceiptView) -> some View {
        VStack(spacing: 6) {
            let headers = BonusReceiptLayout.headerLines(name: r.store?.name, address: r.store?.address, phone: r.store?.phone)
            if !headers.isEmpty {
                ForEach(Array(headers.enumerated()), id: \.offset) { idx, line in
                    Text(line).font(.mono(idx == 0 ? 13 : 11, weight: idx == 0 ? .bold : .regular))
                }
                rule
            }
            row(i18n.t("pos.receiptNumber"), r.saleId)
            row(i18n.t("pos.soldAt"), SaleDate.dayTime(r.soldAt))
            row(i18n.t("pos.cashier"), r.cashier)
            if let customer = r.customer { row(i18n.t("sales.customer"), customer.name) }
            rule
            ForEach(Array(r.items.enumerated()), id: \.offset) { _, item in
                VStack(spacing: 2) {
                    Text(item.model).font(.mono(12))
                    Text(item.unitCode.isEmpty ? item.quantityLabel : item.unitCode).font(.mono(10))
                    if let imei2 = item.imei2, !imei2.isEmpty {
                        Text("\(i18n.t("inventory.imei2", default: "IMEI 2")): \(imei2)").font(.mono(10))
                    }
                    row(subtitle(item), MoneyText.format(item.price.string))
                }
            }
            rule
            if r.showsPricing {
                if r.priceLevelCode != nil && r.priceLevelCode != PriceLevels.retail {
                    row(i18n.t("pricing.priceLevel"), i18n.t(PriceLevels.labelKey(r.priceLevelCode!)))
                }
                if let listPrice = r.listPrice { row(i18n.t("pricing.listPrice"), MoneyText.format(listPrice.string)) }
                if let discount = r.discountAmount { row(i18n.t("pricing.discount"), "− \(MoneyText.format(discount.string))") }
            }
            row(i18n.t("pos.totalDue"), MoneyText.format(r.total.string), bold: true)
            if r.hasTradeIns {
                ForEach(r.tradeIns ?? []) { t in
                    row(i18n.t("purchases.tradeInLabel", default: "Trade-in"), "− \(MoneyText.format(t.value.string))")
                }
                let paid = (Decimal(string: r.total.string) ?? 0) - r.tradeInTotal
                row(i18n.t("purchases.amountPaid", default: "Amount paid"),
                    MoneyText.format(NSDecimalNumber(decimal: paid).stringValue), bold: true)
            }
            let activePayments = r.payments ?? payments
            if !activePayments.isEmpty {
                ForEach(activePayments) { p in
                    row(PaymentAccounts.label(p.accountCode, i18n), MoneyText.format(p.amount.string))
                }
            }
            if let bonus = r.bonus {
                let spent = Decimal(string: bonus.spent) ?? 0
                if spent > 0 {
                    row(i18n.t("sales.paidWithPoints"), "− \(BonusText.format(bonus.spent))")
                }
                let earned = Decimal(string: bonus.earned) ?? 0
                if earned > 0 {
                    row(i18n.t("sales.pointsEarned"), BonusText.format(bonus.earned))
                }
            }
            if let w = r.warranty, let endsAt = w.endsAt {
                row(i18n.t("pos.warrantyUntil"), SaleDate.day(endsAt))
            }
            Text(i18n.t("pos.thankYou")).font(.mono(11)).padding(.top, 6)
            Text(i18n.t("pos.warrantyNotice")).font(.mono(9)).foregroundStyle(Tokens.muted)
            if let footer = r.footer?.trimmingCharacters(in: .whitespacesAndNewlines), !footer.isEmpty {
                Text(footer).font(.mono(11)).foregroundStyle(Tokens.muted).padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }

    private func actions(_ r: ReceiptView) -> some View {
        VStack(spacing: 10) {
            Button {
                let width = BonusReceiptLayout.lineWidth(for: container.storeFlags.receiptPaperWidthMm)
                SalesReceiptPrinting.copy(text(r, width: width))
            } label: {
                Label(i18n.t("pos.copyCheque"), systemImage: "doc.on.doc").frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            if container.storeFlags.receiptPrintingEnabled {
                Button {
                    let width = BonusReceiptLayout.lineWidth(for: container.storeFlags.receiptPaperWidthMm)
                    SalesReceiptPrinting.print(text(r, width: width), jobName: i18n.t("sales.receipt"))
                } label: {
                    Label(i18n.t("sales.printReceipt"), systemImage: "printer").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .foregroundStyle(Tokens.onInk)
            }
        }
    }

    private func subtitle(_ item: ReceiptView.Item) -> String {
        [item.storage, item.color].compactMap { $0 }.joined(separator: " · ")
    }

    private func text(_ r: ReceiptView, width: Int) -> String {
        var lines: [String] = []
        let headers = BonusReceiptLayout.headerLines(name: r.store?.name, address: r.store?.address, phone: r.store?.phone)
        lines.append(contentsOf: headers)
        if !headers.isEmpty {
            lines.append(BonusReceiptLayout.rule(width: width))
        }
        lines.append(BonusReceiptLayout.row(i18n.t("pos.receiptNumber"), r.saleId, width: width))
        if let soldAt = r.soldAt {
            lines.append(BonusReceiptLayout.row(i18n.t("pos.soldAt"), SaleDate.dayTime(soldAt), width: width))
        }
        lines.append(BonusReceiptLayout.row(i18n.t("pos.cashier"), r.cashier, width: width))
        if let customer = r.customer {
            lines.append(BonusReceiptLayout.row(i18n.t("sales.customer"), customer.name, width: width))
        }
        lines.append(BonusReceiptLayout.rule(width: width))
        for item in r.items {
            let desc = "\(item.model) (\(item.unitCode.isEmpty ? item.quantityLabel : item.unitCode))"
            lines.append(desc)
            lines.append(BonusReceiptLayout.row("", MoneyText.format(item.price.string), width: width))
        }
        lines.append(BonusReceiptLayout.rule(width: width))
        lines.append(BonusReceiptLayout.row(i18n.t("pos.totalDue"), MoneyText.format(r.total.string), width: width))
        if let tradeIns = r.tradeIns, !tradeIns.isEmpty {
            for t in tradeIns {
                lines.append(BonusReceiptLayout.row(i18n.t("purchases.tradeInLabel", default: "Trade-in"), "− \(MoneyText.format(t.value.string))", width: width))
            }
        }
        let activePayments = r.payments ?? payments
        if !activePayments.isEmpty {
            for p in activePayments {
                lines.append(BonusReceiptLayout.row(PaymentAccounts.label(p.accountCode, i18n), MoneyText.format(p.amount.string), width: width))
            }
        }
        if let bonus = r.bonus {
            let spent = Decimal(string: bonus.spent) ?? 0
            if spent > 0 {
                lines.append(BonusReceiptLayout.row(i18n.t("sales.paidWithPoints"), "− \(BonusText.format(bonus.spent))", width: width))
            }
            let earned = Decimal(string: bonus.earned) ?? 0
            if earned > 0 {
                lines.append(BonusReceiptLayout.row(i18n.t("sales.pointsEarned"), BonusText.format(bonus.earned), width: width))
            }
        }
        if let w = r.warranty, let endsAt = w.endsAt {
            lines.append(BonusReceiptLayout.row(i18n.t("pos.warrantyUntil"), SaleDate.day(endsAt), width: width))
        }
        lines.append(BonusReceiptLayout.rule(width: width))
        lines.append(i18n.t("pos.thankYou"))
        if let footer = r.footer?.trimmingCharacters(in: .whitespacesAndNewlines), !footer.isEmpty {
            lines.append(footer)
        }
        return lines.joined(separator: "\n")
    }

    private func row(_ label: String, _ value: String, bold: Bool = false) -> some View {
        HStack(alignment: .top) {
            Text(label).font(.mono(11))
            Spacer(minLength: 8)
            Text(value).font(.mono(11, weight: bold ? .bold : .regular))
                .multilineTextAlignment(.trailing)
        }
    }

    private var rule: some View {
        Text(String(repeating: "-", count: 30)).font(.mono(11))
    }

    private func load() {
        error = nil
        let repo = SalesRepository(api: container.api, context: container.modelContext)
        Task {
            do { receipt = try await repo.receipt(saleId) }
            catch let e as AppError { error = e.message }
            catch { self.error = error.localizedDescription }
        }
    }
}
