import SwiftUI

/// One credit's detail as a Warm Card sheet (ADR 0035): agreed price, paid, left
/// to pay and overdue; the goods; the plan parts (each with paid + overdue); the
/// payments; and the actions — take a payment, refund an overpayment, contract.
/// Online only, so it loads from the server and shows a note offline.
struct CreditDetailSheet: View {
    let creditId: String
    let onChanged: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var credit: CreditView?
    @State private var error: String?
    @State private var showPayment = false
    @State private var showRefund = false
    @State private var showContract = false

    private var canPay: Bool { container.session.can("sale.create") }
    private var canRefund: Bool { container.session.can("sale.return") }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("credit.detailTitle")) { dismiss() }
                if let credit {
                    header(credit)
                    summary(credit)
                    CreditGoodsSection(sales: credit.sales)
                    CreditPlanSection(instalments: credit.instalments)
                    CreditPaymentsSection(payments: credit.payments)
                    actions(credit)
                } else if let error {
                    FormErrorLine(message: error)
                } else {
                    LoadingView().frame(height: 160)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.large])
        .appSheet(isPresented: $showPayment) {
            CreditPaymentSheet(creditId: creditId, mode: .payment, maxAmount: nil) { updated in
                credit = updated; onChanged()
            }
        }
        .appSheet(isPresented: $showRefund) {
            CreditPaymentSheet(creditId: creditId, mode: .refund, maxAmount: credit?.overpaidDecimal) { updated in
                credit = updated; onChanged()
            }
        }
        .appSheet(isPresented: $showContract) { CreditContractSheet(creditId: creditId) }
        .task { if credit == nil { await load() } }
    }

    private func header(_ credit: CreditView) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(credit.customer.name).font(.ui(.title)).foregroundStyle(Tokens.text)
            if let phone = credit.customer.phone, !phone.isEmpty {
                Text(phone).font(.data(.regular)).foregroundStyle(Tokens.muted)
            }
        }
    }

    private func summary(_ credit: CreditView) -> some View {
        VStack(spacing: 0) {
            fact(i18n.t("credit.agreedTotal")) { MoneyText(value: credit.agreedTotal, size: 15) }
            fact(i18n.t("credit.paid")) { MoneyText(value: credit.paid, size: 15).foregroundStyle(Tokens.success) }
            fact(i18n.t("credit.outstanding")) {
                MoneyText(value: credit.outstanding, size: 15)
                    .foregroundStyle(credit.settled ? Tokens.muted : Tokens.text)
            }
            if (Decimal(string: credit.overdueAmount) ?? 0) > 0 {
                fact(i18n.t("credit.overdueAmount")) {
                    MoneyText(value: credit.overdueAmount, size: 15).foregroundStyle(Tokens.danger)
                }
            }
            if credit.overpaidDecimal > 0 {
                fact(i18n.t("credit.overpaid"), last: true) {
                    MoneyText(value: credit.overpaid, size: 15).foregroundStyle(Tokens.warning)
                }
            } else if credit.settled {
                fact(i18n.t("credit.settled"), last: true) { StatusBadge(i18n.t("credit.settled"), color: Tokens.success) }
            }
        }
    }

    private func actions(_ credit: CreditView) -> some View {
        VStack(spacing: Tokens.Space.sm) {
            if canPay && !credit.settled {
                pill(i18n.t("credit.takePayment"), .pillPrimary) { showPayment = true }
            }
            if canRefund && credit.overpaidDecimal > 0 {
                pill(i18n.t("credit.refundOverpayment"), .pillSecondary) { showRefund = true }
            }
            pill(i18n.t("credit.contract"), .pillGhost) { showContract = true }
        }
    }

    private func pill(_ title: String, _ style: PillButton, action: @escaping () -> Void) -> some View {
        Button(action: action) { Text(title).frame(maxWidth: .infinity) }.buttonStyle(style)
    }

    private func fact<V: View>(_ label: String, last: Bool = false, @ViewBuilder value: () -> V) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: Tokens.Space.sm) {
                Text(label).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer(minLength: Tokens.Space.sm)
                value().foregroundStyle(Tokens.text)
            }
            .frame(minHeight: Tokens.Space.rowH)
            if !last { Divider().overlay(Tokens.border) }
        }
    }

    private func load() async {
        guard container.connectivity.isOnline else { error = i18n.t("credit.errorOffline"); return }
        error = nil
        do { credit = try await CreditRepository(container).get(creditId) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
