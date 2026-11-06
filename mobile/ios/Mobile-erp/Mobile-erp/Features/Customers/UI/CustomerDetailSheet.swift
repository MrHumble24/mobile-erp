import SwiftUI

/// Customer detail as a Warm Card sheet: name + mono phone + notes, keyed
/// facts (purchases, total spent, warranties, returns), the purchase history
/// as hairline rows (`GET /customers/:id/sales`, online) and edit as a
/// secondary pill for `customer.manage`.
struct CustomerDetailSheet: View {
    let customer: CustomerListItem
    let model: CustomersModel

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var sales: [CustomerSale]?
    @State private var credits: [CreditListItem]?
    @State private var selectedCredit: CreditListItem?
    @State private var error: String?
    @State private var showEdit = false

    private var hasDebt: Bool { (Decimal(string: customer.creditOutstanding ?? "0") ?? 0) > 0 }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: customer.name) { dismiss() }
                VStack(alignment: .leading, spacing: Tokens.Space.xs) {
                    if let phone = customer.phone {
                        Text(phone).font(.data(.regular)).foregroundStyle(Tokens.text)
                    }
                    if let notes = customer.notes, !notes.isEmpty {
                        Text(notes).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                }
                VStack(spacing: 0) {
                    FactRow(label: i18n.t("pricing.customerType")) {
                        Text(i18n.t(PriceLevels.labelKey(customer.level))).font(.ui(.body))
                    }
                    FactRow(label: i18n.t("pricing.standingDiscount")) {
                        Text(customer.standing > 0 ? "\(NSDecimalNumber(decimal: customer.standing).stringValue)%" : "—")
                            .font(.data(.regular))
                    }
                    FactRow(label: i18n.t("customers.statPurchases")) { Text("\(customer.purchaseCount)").font(.data(.regular)) }
                    FactRow(label: i18n.t("customers.statTotalSpent")) { MoneyText(value: customer.totalSpentString, size: 15) }
                    FactRow(label: i18n.t("customers.statActiveWarranties")) { Text("\(customer.activeWarranties)").font(.data(.regular)) }
                    FactRow(label: i18n.t("customers.statReturns"), last: !hasDebt) { Text("\(customer.returnsCount)").font(.data(.regular)) }
                    if hasDebt {
                        FactRow(label: i18n.t("credit.currentDebt")) {
                            MoneyText(value: customer.creditOutstanding ?? "0", size: 15)
                        }
                        FactRow(label: i18n.t("credit.overdue"), last: true) {
                            MoneyText(value: customer.creditOverdue ?? "0", size: 15)
                                .foregroundStyle((Decimal(string: customer.creditOverdue ?? "0") ?? 0) > 0 ? Tokens.danger : Tokens.text)
                        }
                    }
                }
                creditsSection
                CustomerBonusSection(customerId: customer.id)
                Text(i18n.t("customers.purchaseHistory")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                history
                if model.canManage {
                    Button { showEdit = true } label: {
                        Text(i18n.t("customers.edit")).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.pillSecondary)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.large])
        .sheet(isPresented: $showEdit) { CustomerFormSheet(model: model, editing: customer) }
        .appSheet(item: $selectedCredit) { credit in
            CreditDetailSheet(creditId: credit.id) { load() }
        }
        .task { if sales == nil { load() } }
    }

    /// This customer's credits (ADR 0035), shown only when they have some.
    @ViewBuilder private var creditsSection: some View {
        if let credits, !credits.isEmpty {
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(i18n.t("credit.title")).font(.ui(.heading)).foregroundStyle(Tokens.text)
                VStack(spacing: 0) {
                    ForEach(Array(credits.enumerated()), id: \.element.id) { i, credit in
                        Button { selectedCredit = credit } label: {
                            HStack(spacing: Tokens.Space.sm) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(KitDate.day(credit.createdAt)).font(.ui(.body)).foregroundStyle(Tokens.text)
                                    if credit.settled {
                                        Text(i18n.t("credit.settled")).font(.ui(.caption)).foregroundStyle(Tokens.success)
                                    } else if credit.isOverdue {
                                        Text(i18n.t("credit.overdue")).font(.ui(.caption)).foregroundStyle(Tokens.danger)
                                    }
                                }
                                Spacer(minLength: Tokens.Space.sm)
                                MoneyText(value: credit.outstanding, size: 15).foregroundStyle(Tokens.text)
                                Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundStyle(Tokens.muted)
                            }
                            .padding(.vertical, Tokens.Space.sm)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        if i < credits.count - 1 { Divider().overlay(Tokens.border) }
                    }
                }
            }
        }
    }

    @ViewBuilder private var history: some View {
        if let sales {
            if sales.isEmpty {
                Text(i18n.t("customers.noPurchases")).font(.ui(.body)).foregroundStyle(Tokens.muted)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(sales.enumerated()), id: \.offset) { i, sale in
                        HStack(alignment: .center, spacing: Tokens.Space.sm) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(sale.modelLabel).font(.ui(.body)).foregroundStyle(Tokens.text)
                                if !sale.unitCode.isEmpty {
                                    Text(sale.unitCode).font(.data(.regular)).foregroundStyle(Tokens.text)
                                }
                                if let at = sale.soldAt {
                                    Text(KitDate.day(at)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                                }
                            }
                            Spacer(minLength: Tokens.Space.sm)
                            MoneyText(value: sale.salePrice, size: 15).fontWeight(.semibold).foregroundStyle(Tokens.text)
                        }
                        .padding(.vertical, Tokens.Space.sm)
                        if i < sales.count - 1 { Divider().overlay(Tokens.border) }
                    }
                }
            }
        } else if let error {
            FormErrorLine(message: error)
        } else {
            LoadingView().frame(height: 80)
        }
    }

    private func load() {
        guard container.connectivity.isOnline else {
            error = i18n.t("common.offline")
            return
        }
        error = nil
        let repo = CustomersRepository(api: container.api)
        Task {
            do { sales = try await repo.sales(customer.id) }
            catch let e as AppError { error = e.message }
            catch { self.error = error.localizedDescription }
        }
        Task { credits = try? await CreditRepository(container).list(customerId: customer.id) }
    }
}
