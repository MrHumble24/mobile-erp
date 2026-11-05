import SwiftUI

/// Online-only log / edit expense form as a Warm Card sheet. When offline it
/// refuses (expenses are not in the offline outbox) and says to reconnect.
struct LogExpenseSheet: View {
    let model: ExpensesModel
    var expense: Expense?
    var onResult: (String) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var categoryId: String?
    @State private var amount: String
    @State private var description: String
    @State private var vendor: String
    @State private var isRecurring: Bool
    @State private var incurredAt: Date
    @State private var accountCode: String
    @State private var accounts: [PaymentAccount] = []
    @State private var saving = false

    init(model: ExpensesModel, expense: Expense?, onResult: @escaping (String) -> Void) {
        self.model = model
        self.expense = expense
        self.onResult = onResult
        _categoryId = State(initialValue: expense?.categoryId)
        _amount = State(initialValue: expense?.amount ?? "")
        _description = State(initialValue: expense?.description ?? "")
        _vendor = State(initialValue: expense?.vendor ?? "")
        _isRecurring = State(initialValue: expense?.isRecurring ?? false)
        _incurredAt = State(initialValue: expense.flatMap { KitDate.parse($0.incurredAt) } ?? Date())
        _accountCode = State(initialValue: expense?.accountCode ?? PaymentAccounts.cash)
    }

    private var amountValue: Double? {
        let v = Double(amount.replacingOccurrences(of: ",", with: "."))
        return (v ?? -1) > 0 ? v : nil
    }
    private var canSave: Bool { categoryId != nil && amountValue != nil && !saving }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t(expense == nil ? "expenses.newExpense" : "expenses.editExpense")) { dismiss() }
                if !container.connectivity.isOnline { FormErrorLine(message: i18n.t("common.offline"), color: Tokens.warning) }
                AppFormField(label: i18n.t("expenses.category")) {
                    AppSelect(placeholder: i18n.t("common.select"), selection: $categoryId,
                              options: model.activeCategories.map { (String?.some($0.id), $0.name) })
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
                AppFormField(label: i18n.t("expenses.incurredAt")) { AppDateField(date: $incurredAt) }
                AppFormField(label: i18n.t("balance.payFrom")) {
                    AccountPicker(accounts: accounts, selection: $accountCode)
                }
                Toggle(isOn: $isRecurring) {
                    Text(i18n.t("expenses.isRecurring")).font(.ui(.body)).foregroundStyle(Tokens.text)
                }
                .frame(minHeight: Tokens.Space.minTouch)
                Button(action: submit) {
                    if saving { ProgressView().tint(Tokens.onAction).frame(maxWidth: .infinity) }
                    else { Text(i18n.t("common.save")).frame(maxWidth: .infinity) }
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
        guard container.connectivity.isOnline else { onResult(i18n.t("common.offline")); return }
        saving = true
        Haptic.tick.play()
        let desc = description.isEmpty ? nil : description
        let payeeVendor = vendor.isEmpty ? nil : vendor
        let iso = ISO8601DateFormatter().string(from: incurredAt)
        Task {
            do {
                if let expense {
                    try await model.update(id: expense.id, UpdateExpenseDto(
                        categoryId: categoryId, amount: amountValue, description: desc,
                        vendor: payeeVendor, isRecurring: isRecurring, incurredAt: iso,
                        accountCode: accountCode))
                } else {
                    try await model.create(CreateExpenseDto(
                        categoryId: categoryId, amount: amountValue, description: desc,
                        vendor: payeeVendor, isRecurring: isRecurring, incurredAt: iso,
                        accountCode: accountCode))
                }
                onResult(i18n.t("expenses.expenseSaved"))
                dismiss()
            } catch let e as AppError {
                saving = false; onResult(e.message)
            } catch {
                saving = false; onResult(error.localizedDescription)
            }
        }
    }
}
