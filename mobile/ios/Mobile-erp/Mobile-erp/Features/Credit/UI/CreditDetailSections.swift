import SwiftUI

/// The goods on a credit (its not-returned sales), as hairline rows.
struct CreditGoodsSection: View {
    let sales: [CreditSaleView]
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(i18n.t("credit.goods")).font(.ui(.heading)).foregroundStyle(Tokens.text)
            VStack(spacing: 0) {
                ForEach(Array(sales.enumerated()), id: \.element.id) { i, sale in
                    HStack(alignment: .center, spacing: Tokens.Space.sm) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(sale.model).font(.ui(.body)).foregroundStyle(Tokens.text)
                            if !sale.unitCode.isEmpty {
                                Text(sale.unitCode).font(.data(.regular)).foregroundStyle(Tokens.muted)
                            } else if let q = sale.quantity {
                                Text("× \(q)").font(.data(.regular)).foregroundStyle(Tokens.muted)
                            }
                            if sale.returnedAt != nil {
                                StatusBadge(i18n.t("sales.returned"), color: Tokens.danger)
                            }
                        }
                        Spacer(minLength: Tokens.Space.sm)
                        MoneyText(value: sale.salePrice, size: 15).foregroundStyle(Tokens.text)
                    }
                    .padding(.vertical, Tokens.Space.sm)
                    if i < sales.count - 1 { Divider().overlay(Tokens.border) }
                }
            }
        }
    }
}

/// The payment plan: each part with its amount, paid-so-far and overdue state.
struct CreditPlanSection: View {
    let instalments: [CreditInstalmentView]
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(i18n.t("credit.plan")).font(.ui(.heading)).foregroundStyle(Tokens.text)
            VStack(spacing: 0) {
                ForEach(Array(instalments.enumerated()), id: \.element.id) { i, part in
                    HStack(alignment: .center, spacing: Tokens.Space.sm) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("credit.instalment", ["n": String(i + 1)]))
                                .font(.ui(.body)).foregroundStyle(Tokens.text)
                            Text(KitDate.day(part.dueDate)).font(.ui(.caption))
                                .foregroundStyle(part.overdue ? Tokens.danger : Tokens.muted)
                        }
                        Spacer(minLength: Tokens.Space.sm)
                        VStack(alignment: .trailing, spacing: 2) {
                            MoneyText(value: part.amount, size: 15).foregroundStyle(Tokens.text)
                            Text("\(i18n.t("credit.paid")) \(MoneyText.format(part.paid))")
                                .font(.ui(.caption)).foregroundStyle(Tokens.success)
                        }
                    }
                    .padding(.vertical, Tokens.Space.sm)
                    if i < instalments.count - 1 { Divider().overlay(Tokens.border) }
                }
            }
        }
    }
}

/// The payments taken on a credit (down payment + later payments; refunds show
/// as a negative amount).
struct CreditPaymentsSection: View {
    let payments: [CreditPaymentView]
    @Environment(I18n.self) private var i18n

    var body: some View {
        if payments.isEmpty {
            EmptyView()
        } else {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(i18n.t("credit.payments")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                VStack(spacing: 0) {
                    ForEach(Array(payments.enumerated()), id: \.element.id) { i, p in
                        HStack(alignment: .center, spacing: Tokens.Space.sm) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(PaymentAccounts.label(p.accountCode, i18n))
                                    .font(.ui(.body)).foregroundStyle(Tokens.text)
                                Text(KitDate.dayTime(p.occurredAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                            }
                            Spacer(minLength: Tokens.Space.sm)
                            MoneyText(value: p.amount, size: 15)
                                .foregroundStyle((Decimal(string: p.amount) ?? 0) < 0 ? Tokens.danger : Tokens.success)
                        }
                        .padding(.vertical, Tokens.Space.sm)
                        if i < payments.count - 1 { Divider().overlay(Tokens.border) }
                    }
                }
            }
        }
    }
}
