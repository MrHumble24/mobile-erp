import SwiftUI

/// Online-only "Log expense" form. When offline it refuses (expenses are not in
/// the offline outbox) and tells the user to reconnect.
/// Roomy, clear single-column input flow.
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
                Section(i18n.t("expenses.category", default: "Expense Category")) {
                    Picker(i18n.t("expenses.category", default: "Category"), selection: $categoryId) {
                        Text(i18n.t("common.select", default: "Select Category")).tag(String?.none)
                        ForEach(model.categories) { c in
                            Text(c.name).tag(String?.some(c.id))
                        }
                    }
                }

                Section(i18n.t("expenses.amount", default: "Expense Amount")) {
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text("$")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(.secondary)
                        TextField("0", text: $amount)
                            .font(.mono(24, weight: .bold))
                            .keyboardType(.decimalPad)
                            .monospacedDigit()
                    }
                    .padding(.vertical, 2)

                    TextField(i18n.t("expenses.description", default: "Description (what was purchased)"),
                              text: $description)
                }

                Section(i18n.t("expenses.details", default: "Schedule & Date")) {
                    Toggle(i18n.t("expenses.isRecurring", default: "Monthly Recurring Expense"), isOn: $isRecurring)
                    DatePicker(i18n.t("expenses.incurredAt", default: "Date Incurred"),
                               selection: $incurredAt,
                               in: ...Date(), displayedComponents: .date)
                }

                Section {
                    Button(action: submit) {
                        if saving {
                            ProgressView().frame(maxWidth: .infinity)
                        } else {
                            Label(i18n.t("expenses.logExpense", default: "Save Expense"), systemImage: "checkmark.circle.fill")
                                .font(.headline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                                .frame(height: 24)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Tokens.ink)
                    .disabled(!canSave)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle(i18n.t("expenses.newExpense", default: "Log Shop Expense"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel", default: "Cancel")) { dismiss() }
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
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        let dto = CreateExpenseDto(
            categoryId: categoryId, amount: amountValue,
            description: description.isEmpty ? nil : description,
            isRecurring: isRecurring,
            incurredAt: ISO8601DateFormatter().string(from: incurredAt)
        )
        Task {
            do {
                try await model.create(dto)
                onResult(i18n.t("expenses.expenseSaved", default: "Expense saved successfully."))
                dismiss()
            } catch let e as AppError {
                saving = false; onResult(e.message)
            } catch {
                saving = false; onResult(error.localizedDescription)
            }
        }
    }
}
