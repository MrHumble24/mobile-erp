import SwiftUI

/// Record a partner payment — online-only (`partner.payment`). Blocks offline.
/// "Pay in full" is a ghost link that fills the outstanding amount.
struct RecordPaymentSheet: View {
    let partner: Partner
    var onSaved: () -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var amount = ""
    @State private var notes = ""
    @State private var accountCode = PaymentAccounts.cash
    @State private var accounts: [PaymentAccount] = []
    @State private var saving = false
    @State private var errorMessage: String?

    private var online: Bool { container.connectivity.isOnline }
    private var outstanding: Double { Double(partner.outstanding) ?? 0 }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("partners.recordPayment")) { dismiss() }
                SubjectBlock(title: partner.shopName,
                             line: "\(i18n.t("partners.outstanding")): \(MoneyText.format(partner.outstanding))")
                if !online { FormErrorLine(message: i18n.t("common.offline"), color: Tokens.warning) }
                AppFormField(label: i18n.t("partners.paymentAmount")) {
                    AppTextField(placeholder: "0", text: $amount, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($amount)
                }
                if outstanding > 0, amount != String(Int(outstanding)) {
                    Button(i18n.t("partners.payFull", ["amount": MoneyText.format(partner.outstanding)])) {
                        amount = String(Int(outstanding))
                        Haptic.tick.play()
                    }
                    .buttonStyle(.pillGhost)
                }
                AppFormField(label: i18n.t("balance.paidWith")) {
                    AccountPicker(accounts: accounts, selection: $accountCode)
                }
                AppFormField(label: i18n.t("common.notes")) {
                    AppTextField(placeholder: i18n.t("common.notes"), text: $notes)
                }
                if let errorMessage { FormErrorLine(message: errorMessage) }
                Button { Task { await save() } } label: {
                    Text(i18n.t("partners.recordPayment")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(saving || !online || (Double(amount) ?? 0) <= 0)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
        .task {
            accounts = await PaymentAccounts.load(
                api: container.api,
                canReadBalances: container.session.can("balance.read"),
                i18n: i18n)
        }
    }

    private func save() async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        let t = notes.trimmingCharacters(in: .whitespaces)
        do {
            Haptic.tick.play()
            try await container.partnerRepository.recordPayment(partner.id, RecordPaymentDto(
                amount: Double(amount) ?? 0, consignmentId: nil, paidAt: nil,
                notes: t.isEmpty ? nil : t, accountCode: accountCode))
            container.sync.syncNow()
            onSaved()
            dismiss()
        } catch {
            errorMessage = (error as? AppError)?.message ?? i18n.t("common.error")
        }
    }
}
