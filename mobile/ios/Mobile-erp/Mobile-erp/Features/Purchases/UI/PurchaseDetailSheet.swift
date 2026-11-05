import SwiftUI

/// One customer purchase in full (ADR 0039): the unit, the seller, the money and
/// who logged it. `pricePaid` / `account` show only when the server sent them
/// (redacted without the cost permission); a trade-in is tagged.
struct PurchaseDetailSheet: View {
    let purchaseId: String
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var purchase: CustomerPurchaseView?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.gutter) {
                SheetTitleRow(title: i18n.t("purchases.detailTitle", default: "Purchase")) { dismiss() }
                if let purchase { body(purchase) }
                else if let error { ErrorStateView(message: error) { load() } }
                else { LoadingView().frame(height: 160) }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollBounceBehavior(.basedOnSize)
        .background(Tokens.card)
        .task { if purchase == nil { load() } }
    }

    private func body(_ p: CustomerPurchaseView) -> some View {
        VStack(alignment: .leading, spacing: Tokens.Space.md) {
            SubjectBlock(title: p.unit.model.label, line: p.unit.code) {
                if p.isTradeIn { StatusBadge(i18n.t("purchases.tradeInLabel", default: "Trade-in"), color: Tokens.info) }
            }
            AppCard {
                VStack(spacing: 0) {
                    FactRow(label: i18n.t("purchases.seller", default: "Seller")) { Text(p.customer.name).font(.ui(.body)) }
                    if let phone = p.customer.phone, !phone.isEmpty, let url = URL(string: "tel:\(phone)") {
                        FactRow(label: i18n.t("common.phone", default: "Phone")) {
                            Link(phone, destination: url).font(.ui(.bodyStrong)).foregroundStyle(Tokens.info)
                        }
                    }
                    if let price = p.pricePaid {
                        FactRow(label: i18n.t("purchases.pricePaid", default: "Price paid")) { MoneyText(value: price, size: 15) }
                    }
                    if let account = p.accountCode {
                        FactRow(label: i18n.t("purchases.account", default: "Paid from")) {
                            Text(PaymentAccounts.label(account, i18n)).font(.ui(.body))
                        }
                    }
                    FactRow(label: i18n.t("purchases.soldBy", default: "Logged by")) { Text(p.soldBy.name).font(.ui(.body)) }
                    FactRow(label: i18n.t("sales.soldAt", default: "At"), last: true) {
                        Text(KitDate.day(p.occurredAt)).font(.data(.regular))
                    }
                }
            }
        }
    }

    private func load() {
        error = nil
        Task {
            do { purchase = try await PurchasesRepository(container).get(purchaseId) }
            catch let e as AppError { error = e.message }
            catch { self.error = error.localizedDescription }
        }
    }
}
