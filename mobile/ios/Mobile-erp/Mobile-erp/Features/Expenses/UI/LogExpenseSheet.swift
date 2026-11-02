import SwiftUI

/// Online-only "Log expense" form. When offline it refuses (expenses are not in
/// the offline outbox) and tells the user to reconnect.
struct LogExpenseSheet: View {
    let model: ExpensesModel
    var onResult: (String) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var categoryId: String?
    @State private var amount = ""
    @State private var description = ""
    @State private var isRecurring = false
    @State private var incurredAt = Date()
    @State private var saving = false

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
                    ForEach(model.categories) { c in
                        Text(c.name).tag(String?.some(c.id))
                    }
                }
                Section {
                    TextField(i18n.t("expenses.amount"), text: $amount)
                        .keyboardType(.decimalPad)
                        .font(.mono(16))
                    TextField(i18n.t("expenses.description"), text: $description)
                }
                Section {
                    Toggle(i18n.t("expenses.isRecurring"), isOn: $isRecurring)
                    DatePicker(i18n.t("expenses.incurredAt"), selection: $incurredAt,
                               in: ...Date(), displayedComponents: .date)
                }
            }
            .navigationTitle(i18n.t("expenses.newExpense"))
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
            onResult(i18n.t("common.offline", default: "No connection — reconnect to save."))
            return
        }
        saving = true
        let dto = CreateExpenseDto(
            categoryId: categoryId, amount: amountValue,
            description: description.isEmpty ? nil : description,
            isRecurring: isRecurring,
            incurredAt: ISO8601DateFormatter().string(from: incurredAt)
        )
        Task {
            do {
                try await model.create(dto)
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
