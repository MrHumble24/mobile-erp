import SwiftUI

/// Create or edit a recurring expense template (web `ExpenseRecurrenceDialog`).
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
    @State private var saving = false

    init(categories: [ExpenseCategory], recurrence: ExpenseRecurrence?,
         onDone: @escaping (String?) async -> Void) {
        self.categories = categories
        self.recurrence = recurrence
        self.onDone = onDone
        _categoryId = State(initialValue: recurrence?.categoryId)
        _amount = State(initialValue: recurrence?.amount ?? "")
        _frequency = State(initialValue: recurrence?.frequency ?? "monthly")
        _nextDueAt = State(initialValue: recurrence.flatMap { ISO8601DateFormatter().date(from: $0.nextDueAt) } ?? Date())
        _vendor = State(initialValue: recurrence?.vendor ?? "")
        _description = State(initialValue: recurrence?.description ?? "")
    }

    private var amountValue: Double? {
        let v = Double(amount.replacingOccurrences(of: ",", with: "."))
        return (v ?? -1) > 0 ? v : nil
    }
    private var canSave: Bool { categoryId != nil && amountValue != nil && !saving }

    var body: some View {
        NavigationStack {
            Form {
                Picker(i18n.t("expenses.category"), selection: $categoryId) {
                    Text(i18n.t("common.select")).tag(String?.none)
                    ForEach(categories) { c in Text(c.name).tag(String?.some(c.id)) }
                }
                Section {
                    TextField(i18n.t("expenses.amount"), text: $amount)
                        .keyboardType(.decimalPad).font(.mono(16))
                    Picker(i18n.t("expenses.frequency"), selection: $frequency) {
                        Text(i18n.t("expenses.frequencyMonthly")).tag("monthly")
                        Text(i18n.t("expenses.frequencyWeekly")).tag("weekly")
                    }
                    DatePicker(i18n.t("expenses.nextDueAt"), selection: $nextDueAt,
                               displayedComponents: .date)
                }
                Section {
                    TextField(i18n.t("expenses.vendor"), text: $vendor)
                    TextField(i18n.t("expenses.description"), text: $description)
                }
            }
            .navigationTitle(i18n.t(recurrence == nil ? "expenses.newRecurrence" : "expenses.editRecurrence"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save"), action: submit).disabled(!canSave)
                }
            }
        }
    }

    private func submit() {
        guard let categoryId, let amountValue else { return }
        guard container.connectivity.isOnline else {
            Task { await onDone(i18n.t("common.offline", default: "No connection — reconnect to save.")) }
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
                        vendor: payee, frequency: frequency, nextDueAt: iso, isActive: nil))
                } else {
                    try await repo.create(CreateExpenseRecurrenceDto(
                        categoryId: categoryId, amount: amountValue, description: desc,
                        vendor: payee, frequency: frequency, nextDueAt: iso))
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
