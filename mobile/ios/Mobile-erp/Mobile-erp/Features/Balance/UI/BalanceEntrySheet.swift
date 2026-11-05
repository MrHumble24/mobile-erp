import SwiftUI

/// Manual ledger entry (opening / deposit / withdraw / correction) as a Warm Card
/// sheet. Deposit and withdraw take a positive amount; opening and correction add
/// a +/- sign toggle. Correction requires a note. Online-only — refuses when
/// offline (ledger entries are never queued).
struct BalanceEntrySheet: View {
    let model: BalanceModel
    let kind: BalanceEntryKind
    let accounts: [BalanceAccount]
    var onResult: (String) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var accountCode: String?
    @State private var magnitude = ""
    @State private var negative = false
    @State private var note = ""
    @State private var error: String?
    @State private var saving = false

    private var magnitudeValue: Double? {
        let v = Double(magnitude.replacingOccurrences(of: ",", with: "."))
        return (v ?? 0) > 0 ? v : nil
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t(kind.titleKey)) { dismiss() }
                if !container.connectivity.isOnline {
                    FormErrorLine(message: i18n.t("common.offline", default: "Offline"), color: Tokens.warning)
                }
                AppFormField(label: i18n.t("balance.filterAccount")) {
                    AppSelect(placeholder: i18n.t("common.select"), selection: $accountCode,
                              options: accounts.map { (String?.some($0.accountCode),
                                                       BalanceFormat.account($0.accountCode, label: $0.label, i18n)) })
                }
                if kind.signed {
                    SegmentedControl(selection: $negative, segments: [(false, "+"), (true, "−")])
                }
                AppFormField(label: i18n.t("balance.amount")) {
                    AppTextField(placeholder: "0", text: $magnitude, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($magnitude)
                }
                AppFormField(label: i18n.t(kind.noteKey)) {
                    AppTextField(placeholder: i18n.t("balance.note"), text: $note)
                }
                if let hintKey = kind.hintKey {
                    Text(i18n.t(hintKey)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
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
        guard let accountCode else { error = i18n.t("common.select"); return }
        guard let magnitudeValue else { error = i18n.t("balance.errorAmountRequired"); return }
        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)
        if kind.requiresNote && trimmedNote.isEmpty { error = i18n.t("balance.errorReasonRequired"); return }
        guard container.connectivity.isOnline else { onResult(i18n.t("common.offline", default: "Offline")); return }
        error = nil
        saving = true
        Haptic.tick.play()
        let amount = kind.signed && negative ? -magnitudeValue : magnitudeValue
        let dto = CreateLedgerTransactionDto(
            accountCode: accountCode, typeCode: kind.typeCode, amount: amount,
            note: trimmedNote.isEmpty ? nil : trimmedNote, occurredAt: nil)
        Task {
            do {
                try await model.createEntry(dto)
                onResult(i18n.t("balance.entrySaved"))
                dismiss()
            } catch let e as AppError {
                saving = false
                error = e.statusCode == 409 ? i18n.t("balance.errorOpeningExists") : e.message
            } catch {
                saving = false; self.error = error.localizedDescription
            }
        }
    }
}
