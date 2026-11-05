import SwiftUI

/// The printable credit contract (ADR 0035): store identity, customer, goods with
/// prices, the down payment, the plan and the plain no-interest statement. Read
/// only — a client prints from `GET /credits/:id/contract`.
struct CreditContractSheet: View {
    let creditId: String
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var contract: CreditContract?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("credit.contract")) { dismiss() }
                if let contract {
                    body(contract)
                } else if let error {
                    FormErrorLine(message: error)
                } else {
                    LoadingView().frame(height: 120)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.large])
        .task { if contract == nil { await load() } }
    }

    @ViewBuilder private func body(_ c: CreditContract) -> some View {
        if let name = c.store.name, !name.isEmpty {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.ui(.heading)).foregroundStyle(Tokens.text)
                if let addr = c.store.address, !addr.isEmpty { line(addr) }
                if let phone = c.store.phone, !phone.isEmpty { line(phone) }
            }
        }
        VStack(alignment: .leading, spacing: 2) {
            Text(i18n.t("credit.buyer")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Text(c.customer.name).font(.ui(.body)).foregroundStyle(Tokens.text)
            if let phone = c.customer.phone, !phone.isEmpty { line(phone) }
        }
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(i18n.t("credit.goods")).font(.ui(.heading)).foregroundStyle(Tokens.text)
            ForEach(c.goods) { good in
                HStack(spacing: Tokens.Space.sm) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(good.description).font(.ui(.body)).foregroundStyle(Tokens.text)
                        if let code = good.imei ?? good.serialNumber, !code.isEmpty {
                            Text(code).font(.data(.regular)).foregroundStyle(Tokens.muted)
                        }
                    }
                    Spacer(minLength: Tokens.Space.sm)
                    MoneyText(value: good.price, size: 15)
                }
            }
        }
        VStack(spacing: 0) {
            row(i18n.t("credit.agreedTotal"), c.agreedTotal)
            row(i18n.t("credit.downPayment"), c.downPayment)
        }
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(i18n.t("credit.plan")).font(.ui(.heading)).foregroundStyle(Tokens.text)
            ForEach(c.instalments) { part in
                HStack(spacing: Tokens.Space.sm) {
                    Text(KitDate.day(part.dueDate)).font(.data(.regular)).foregroundStyle(Tokens.text)
                    Spacer(minLength: Tokens.Space.sm)
                    MoneyText(value: part.amount, size: 15)
                }
            }
        }
        Text(c.terms.isEmpty ? i18n.t("credit.noInterest") : c.terms)
            .font(.ui(.caption)).foregroundStyle(Tokens.muted)
    }

    private func line(_ text: String) -> some View {
        Text(text).font(.data(.regular)).foregroundStyle(Tokens.muted)
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack(spacing: Tokens.Space.sm) {
            Text(label).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Spacer(minLength: Tokens.Space.sm)
            MoneyText(value: value, size: 15)
        }
        .frame(minHeight: Tokens.Space.rowH)
    }

    private func load() async {
        guard container.connectivity.isOnline else { error = i18n.t("credit.errorOffline"); return }
        do { contract = try await CreditRepository(container).contract(creditId) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
