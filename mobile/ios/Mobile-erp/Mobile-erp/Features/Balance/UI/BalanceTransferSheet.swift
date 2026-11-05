import SwiftUI

/// Move money between two accounts. The amount is always positive and the two
/// accounts must differ. Online-only — refuses when offline.
struct BalanceTransferSheet: View {
    let model: BalanceModel
    let accounts: [BalanceAccount]
    var onResult: (String) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var fromCode: String?
    @State private var toCode: String?
    @State private var amount = ""
    @State private var note = ""
    @State private var error: String?
    @State private var saving = false

    private var amountValue: Double? {
        let v = Double(amount.replacingOccurrences(of: ",", with: "."))
        return (v ?? 0) > 0 ? v : nil
    }
    private var accountOptions: [(value: String?, label: String)] {
        accounts.map { (String?.some($0.accountCode),
                        BalanceFormat.account($0.accountCode, label: $0.label, i18n)) }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t("balance.transfer")) { dismiss() }
                if !container.connectivity.isOnline {
                    FormErrorLine(message: i18n.t("common.offline", default: "Offline"), color: Tokens.warning)
                }
                AppFormField(label: i18n.t("balance.fromAccount")) {
                    AppSelect(placeholder: i18n.t("common.select"), selection: $fromCode, options: accountOptions)
                }
                AppFormField(label: i18n.t("balance.toAccount")) {
                    AppSelect(placeholder: i18n.t("common.select"), selection: $toCode, options: accountOptions)
                }
                AppFormField(label: i18n.t("balance.amount")) {
                    AppTextField(placeholder: "0", text: $amount, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($amount)
                }
                AppFormField(label: i18n.t("balance.note")) {
                    AppTextField(placeholder: i18n.t("balance.note"), text: $note)
                }
                if let error { FormErrorLine(message: error) }
                Button(action: submit) {
                    if saving { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("common.save")).frame(maxWidth: .infinity) }
                }
                .buttonStyle(.pillPrimary)
                .disabled(saving)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
    }

    private func submit() {
        guard let fromCode, let toCode else { error = i18n.t("common.select"); return }
        guard fromCode != toCode else { error = i18n.t("balance.errorSameAccount"); return }
        guard let amountValue else { error = i18n.t("balance.errorAmountRequired"); return }
        guard container.connectivity.isOnline else { onResult(i18n.t("common.offline", default: "Offline")); return }
        error = nil
        saving = true
        Haptic.tick.play()
        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)
        let dto = CreateLedgerTransferDto(
            fromAccountCode: fromCode, toAccountCode: toCode, amount: amountValue,
            note: trimmedNote.isEmpty ? nil : trimmedNote)
        Task {
            do {
                try await model.createTransfer(dto)
                onResult(i18n.t("balance.transferSaved"))
                dismiss()
            } catch let e as AppError {
                saving = false; error = e.message
            } catch {
                saving = false; self.error = error.localizedDescription
            }
        }
    }
}
