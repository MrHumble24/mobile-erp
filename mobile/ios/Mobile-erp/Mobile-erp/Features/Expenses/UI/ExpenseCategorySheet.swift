import SwiftUI

/// Create or edit an expense category. Editing adds an active toggle; turning a
/// category off reveals a reassign picker so its expenses move to a live
/// category before it deactivates (server enforces this — web parity).
struct ExpenseCategorySheet: View {
    let model: ExpensesModel
    var category: ExpenseCategory?
    var onResult: (String) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var description: String
    @State private var sortOrder: String
    @State private var isActive: Bool
    @State private var reassignToId: String?
    @State private var saving = false

    init(model: ExpensesModel, category: ExpenseCategory?, onResult: @escaping (String) -> Void) {
        self.model = model
        self.category = category
        self.onResult = onResult
        _name = State(initialValue: category?.name ?? "")
        _description = State(initialValue: category?.description ?? "")
        _sortOrder = State(initialValue: category.map { String($0.sortOrder) } ?? "0")
        _isActive = State(initialValue: category?.isActive ?? true)
        _reassignToId = State(initialValue: nil)
    }

    private var isEdit: Bool { category != nil }
    private var reassignTargets: [ExpenseCategory] {
        model.categories.filter { $0.isActive && $0.id != category?.id }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(i18n.t("expenses.categoryName"), text: $name)
                    TextField(i18n.t("expenses.description"), text: $description)
                    TextField(i18n.t("expenses.sortOrder"), text: $sortOrder)
                        .keyboardType(.numberPad)
                        .sanitizeDigits($sortOrder)
                }
                if isEdit {
                    Section {
                        Toggle(i18n.t("expenses.categoryActive"), isOn: $isActive)
                    }
                    if !isActive {
                        Section(footer: Text(i18n.t("expenses.reassignRequired"))) {
                            Picker(i18n.t("expenses.reassignTo"), selection: $reassignToId) {
                                Text(i18n.t("common.select")).tag(String?.none)
                                ForEach(reassignTargets) { c in Text(c.name).tag(String?.some(c.id)) }
                            }
                        }
                    }
                }
            }
            .navigationTitle(i18n.t(isEdit ? "expenses.editCategory" : "expenses.newCategory"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(i18n.t("common.cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.save"), action: submit)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || saving)
                }
            }
        }
    }

    private func submit() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        guard container.connectivity.isOnline else {
            onResult(i18n.t("common.offline", default: "No connection — reconnect to save."))
            return
        }
        saving = true
        let repo = ExpensesRepository(api: container.api)
        let desc = description.isEmpty ? nil : description
        Task {
            do {
                if let category {
                    try await repo.updateCategory(id: category.id, UpdateExpenseCategoryDto(
                        name: trimmed, description: desc, sortOrder: Int(sortOrder),
                        isActive: isActive, reassignToId: isActive ? nil : reassignToId))
                } else {
                    try await repo.createCategory(CreateExpenseCategoryDto(name: trimmed, description: desc))
                }
                await model.refreshCategories()
                onResult(i18n.t("expenses.categorySaved"))
                dismiss()
            } catch let e as AppError {
                saving = false; onResult(e.message)
            } catch {
                saving = false; onResult(error.localizedDescription)
            }
        }
    }
}
