import SwiftUI

/// Create or edit a recurring expense template as a Warm Card sheet.
/// Online-only; calls back with a result message after a successful save.
struct ExpenseRecurrenceSheet: View {
    let categories: [ExpenseCategory]
    var recurrence: ExpenseRecurrence?
    var onDone: (String?) async -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var categoryId: String?
    @State private var amount: String
    @State private var frequency: String
    @State private var nextDueAt: Date
    @State private var vendor: String
    @State private var description: String
    @State private var accountCode: String
    @State private var accounts: [PaymentAccount] = []
    @State private var saving = false

    init(categories: [ExpenseCategory], recurrence: ExpenseRecurrence?, onDone: @escaping (String?) async -> Void) {
        self.categories = categories
        self.recurrence = recurrence
        self.onDone = onDone
        _categoryId = State(initialValue: recurrence?.categoryId)
        _amount = State(initialValue: recurrence?.amount ?? "")
        _frequency = State(initialValue: recurrence?.frequency ?? "monthly")
        _nextDueAt = State(initialValue: recurrence.flatMap { KitDate.parse($0.nextDueAt) } ?? Date())
        _vendor = State(initialValue: recurrence?.vendor ?? "")
        _description = State(initialValue: recurrence?.description ?? "")
        _accountCode = State(initialValue: recurrence?.accountCode ?? PaymentAccounts.cash)
    }

    private var amountValue: Double? {
        let v = Double(amount.replacingOccurrences(of: ",", with: "."))
        return (v ?? -1) > 0 ? v : nil
    }
    private var canSave: Bool { categoryId != nil && amountValue != nil && !saving }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t(recurrence == nil ? "expenses.newRecurrence" : "expenses.editRecurrence")) { dismiss() }
                AppFormField(label: i18n.t("expenses.category")) {
                    AppSelect(placeholder: i18n.t("common.select"), selection: $categoryId,
                              options: categories.map { (String?.some($0.id), $0.name) })
                }
                AppFormField(label: i18n.t("expenses.amount")) {
                    AppTextField(placeholder: "0", text: $amount, keyboard: .decimalPad, font: .data(.regular))
                        .sanitizeDecimal($amount)
                }
                AppFormField(label: i18n.t("expenses.vendor")) {
                    AppTextField(placeholder: i18n.t("expenses.vendorPlaceholder"), text: $vendor)
                }
                AppFormField(label: i18n.t("expenses.description")) {
                    AppTextField(placeholder: i18n.t("expenses.descriptionPlaceholder"), text: $description)
                }
                AppFormField(label: i18n.t("expenses.frequency")) {
                    SegmentedControl(selection: $frequency, segments: [
                        ("monthly", i18n.t("expenses.frequencyMonthly")),
                        ("weekly", i18n.t("expenses.frequencyWeekly")),
                    ])
                }
                AppFormField(label: i18n.t("expenses.nextDueAt")) { AppDateField(date: $nextDueAt) }
                AppFormField(label: i18n.t("balance.payFrom")) {
                    AccountPicker(accounts: accounts, selection: $accountCode)
                }
                Button(action: submit) {
                    Text(i18n.t("common.save")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(!canSave)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.large])
        .task {
            accounts = await PaymentAccounts.load(
                api: container.api,
                canReadBalances: container.session.can("balance.read"),
                i18n: i18n)
        }
    }

    private func submit() {
        guard let categoryId, let amountValue else { return }
        guard container.connectivity.isOnline else {
            Task { await onDone(i18n.t("common.offline")) }
            dismiss(); return
        }
        saving = true
        let repo = ExpenseRecurrencesRepository(api: container.api)
        let desc = description.isEmpty ? nil : description
        let payee = vendor.isEmpty ? nil : vendor
        let iso = ISO8601DateFormatter().string(from: nextDueAt)
        Task {
            do {
                if let recurrence {
                    try await repo.update(id: recurrence.id, UpdateExpenseRecurrenceDto(
                        categoryId: categoryId, amount: amountValue, description: desc,
                        vendor: payee, frequency: frequency, nextDueAt: iso, isActive: nil,
                        accountCode: accountCode))
                } else {
                    try await repo.create(CreateExpenseRecurrenceDto(
                        categoryId: categoryId, amount: amountValue, description: desc,
                        vendor: payee, frequency: frequency, nextDueAt: iso,
                        accountCode: accountCode))
                }
                await onDone(i18n.t("expenses.recurrenceSaved"))
                dismiss()
            } catch let e as AppError {
                saving = false; await onDone(e.message)
            } catch {
                saving = false; await onDone(error.localizedDescription)
            }
        }
    }
}
