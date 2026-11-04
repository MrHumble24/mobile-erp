import SwiftUI

/// Create or edit an expense category as a Warm Card sheet. Editing adds the
/// active switch; turning a category off reveals a reassign picker so its
/// expenses move to a live category before it deactivates (server enforces).
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
    private var reassignTargets: [ExpenseCategory] { model.categories.filter { $0.isActive && $0.id != category?.id } }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: i18n.t(isEdit ? "expenses.editCategory" : "expenses.newCategory")) { dismiss() }
                AppFormField(label: i18n.t("expenses.categoryName")) {
                    AppTextField(placeholder: i18n.t("expenses.categoryName"), text: $name)
                }
                AppFormField(label: i18n.t("expenses.description")) {
                    AppTextField(placeholder: i18n.t("expenses.description"), text: $description)
                }
                AppFormField(label: i18n.t("expenses.sortOrder")) {
                    AppTextField(placeholder: "0", text: $sortOrder, keyboard: .numberPad, font: .data(.regular))
                        .sanitizeDigits($sortOrder)
                }
                if isEdit {
                    Toggle(isOn: $isActive) {
                        Text(i18n.t("expenses.categoryActive")).font(.ui(.body)).foregroundStyle(Tokens.text)
                    }
                    .frame(minHeight: Tokens.Space.minTouch)
                    if !isActive {
                        AppFormField(label: i18n.t("expenses.reassignTo")) {
                            AppSelect(placeholder: i18n.t("common.select"), selection: $reassignToId,
                                      options: reassignTargets.map { (String?.some($0.id), $0.name) })
                        }
                        Text(i18n.t("expenses.reassignRequired")).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                }
                Button(action: submit) {
                    Text(i18n.t("common.save")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || saving)
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Tokens.card)
        .presentationDetents([.medium, .large])
    }

    private func submit() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        guard container.connectivity.isOnline else { onResult(i18n.t("common.offline")); return }
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
