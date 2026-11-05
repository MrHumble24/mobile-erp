import SwiftUI

/// The till "sell on credit" sheet (ADR 0035): the customer's current debt and
/// limit, the cart total, a down payment (cash / card / split), a payment plan,
/// then `POST /credits`. Credit is **online only** — the caller disables the
/// entry point offline; this also guards. No interest or late fee anywhere.
struct CreditSheet: View {
    let lines: [CreditLinePost]
    let dueTotal: Decimal
    let customerId: String?
    let customerName: String?
    let customerPhone: String?
    /// Called once the credit is sold so the till can clear the cart.
    let onSold: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var draft: CreditDraft
    @State private var customer: CreditCustomer?
    @State private var created: CreditView?
    @State private var busy = false
    @State private var error: String?
    @State private var accountsLoaded = false
    @State private var clientKey = newUUID()

    init(lines: [CreditLinePost], dueTotal: Decimal, customerId: String?,
         customerName: String?, customerPhone: String?, onSold: @escaping () -> Void) {
        self.lines = lines
        self.dueTotal = dueTotal
        self.customerId = customerId
        self.customerName = customerName
        self.customerPhone = customerPhone
        self.onSold = onSold
        _draft = State(initialValue: CreditDraft(dueTotal: dueTotal))
    }

    private var offline: Bool { !container.connectivity.isOnline }
    /// A named customer with a phone is required.
    private var ready: Bool {
        customerId != nil && !(customerPhone ?? "").trimmingCharacters(in: .whitespaces).isEmpty
    }
    private var newUnpaid: Decimal { dueTotal - draft.downPaymentDecimal }
    private var overLimit: Bool {
        guard let customer else { return false }
        return CreditPlan.wouldExceedLimit(currentOutstanding: customer.outstanding,
                                           newUnpaid: newUnpaid, limit: customer.effectiveLimit)
    }
    private var canSell: Bool {
        !offline && !lines.isEmpty && draft.planValid && !overLimit && !busy
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("credit.payOnCredit")) { dismiss() }
                if let created {
                    CreditResultView(credit: created) { dismiss() }
                } else if !ready {
                    needsCustomer
                } else {
                    form
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task {
            if !accountsLoaded {
                draft.setAccounts(await PaymentAccounts.load(api: container.api, i18n: i18n))
                accountsLoaded = true
            }
            if ready, customer == nil, let id = customerId, !offline {
                customer = try? await CreditRepository(container).customer(id)
            }
        }
    }

    private var needsCustomer: some View {
        VStack(spacing: Tokens.Space.sm) {
            Text(customerName.map { "\($0) —" } ?? "").font(.ui(.body)).foregroundStyle(Tokens.text)
            Text(i18n.t("credit.needsCustomer")).font(.ui(.body)).foregroundStyle(Tokens.muted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }

    @ViewBuilder private var form: some View {
        if let customer {
            CreditCustomerSummary(customer: customer, overLimit: overLimit)
        }
        totalRow
        CreditDownPaymentField(draft: draft)
        CreditPlanBuilder(draft: draft)
        if offline { FormErrorLine(message: i18n.t("credit.errorOffline")) }
        if overLimit { FormErrorLine(message: i18n.t("credit.errorLimit")) }
        if let error { FormErrorLine(message: error) }
        Button(action: sell) {
            if busy { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
            else { Text(i18n.t("credit.sellButton")).frame(maxWidth: .infinity) }
        }
        .buttonStyle(.pillPrimary)
        .disabled(!canSell)
    }

    private var totalRow: some View {
        AppCard {
            HStack {
                Text(i18n.t("pos.subtotal")).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                Spacer()
                Text(MoneyText.format(NSDecimalNumber(decimal: dueTotal).stringValue))
                    .font(.data(.large)).foregroundStyle(Tokens.text)
            }
        }
    }

    private func sell() {
        guard canSell, let customerId else { return }
        busy = true
        error = nil
        let payload = CreateCreditPayload(
            customerId: customerId, lines: lines,
            payments: draft.tenderParts.isEmpty ? nil : draft.tenderParts,
            instalments: draft.instalmentsPost, note: nil, clientKey: clientKey)
        Task {
            do {
                let credit = try await CreditRepository(container).create(payload)
                busy = false
                container.toasts.success(i18n.t("credit.created"))
                onSold()
                created = credit
            } catch let e as AppError {
                busy = false
                error = CreditError.message(e, i18n)
            } catch {
                busy = false
                self.error = error.localizedDescription
            }
        }
    }
}

/// The customer's current debt + limit, with an over-limit warning tint.
struct CreditCustomerSummary: View {
    let customer: CreditCustomer
    let overLimit: Bool
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(spacing: 0) {
                row(i18n.t("credit.currentDebt"), customer.creditOutstanding,
                    tint: (customer.outstanding > 0) ? Tokens.text : Tokens.muted)
                row(i18n.t("credit.effectiveLimit"),
                    customer.effectiveCreditLimit ?? i18n.t("credit.noLimit"),
                    tint: overLimit ? Tokens.danger : Tokens.text, last: true,
                    isMoney: customer.effectiveCreditLimit != nil)
            }
        }
    }

    private func row(_ label: String, _ value: String, tint: Color, last: Bool = false, isMoney: Bool = true) -> some View {
        VStack(spacing: 0) {
            HStack(spacing: Tokens.Space.sm) {
                Text(label).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                Spacer(minLength: Tokens.Space.sm)
                if isMoney { MoneyText(value: value, size: 15).foregroundStyle(tint) }
                else { Text(value).font(.data(.regular)).foregroundStyle(tint) }
            }
            .frame(minHeight: Tokens.Space.rowH)
            if !last { Divider().overlay(Tokens.border) }
        }
    }
}
