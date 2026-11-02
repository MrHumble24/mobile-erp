import SwiftUI

/// Expense categories: list with active state, plus add / edit / deactivate /
/// reassign for `expense.category.manage` users (web `ExpensesCategoriesTab`).
struct ExpenseCategoriesTab: View {
    let model: ExpensesModel
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var editing: ExpenseCategory?
    @State private var showNew = false

    private var canManage: Bool { container.session.can("expense.category.manage") }

    var body: some View {
        List {
            ForEach(model.categories) { category in
                Button {
                    if canManage { editing = category }
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(category.name).foregroundStyle(Tokens.ink)
                            if let d = category.description, !d.isEmpty {
                                Text(d).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        Spacer()
                        StatusBadge(
                            category.isActive ? i18n.t("expenses.categoryActive") : i18n.t("common.no"),
                            color: category.isActive ? Tokens.success : Tokens.slate)
                    }
                }
                .buttonStyle(.plain)
                .disabled(!canManage)
            }
            if model.categories.isEmpty {
                Text(i18n.t("common.notFound")).foregroundStyle(.secondary)
            }
        }
        .listStyle(.insetGrouped)
        .toolbar {
            if canManage {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showNew = true } label: { Image(systemName: "plus") }
                        .accessibilityLabel(i18n.t("expenses.newCategory"))
                }
            }
        }
        .sheet(isPresented: $showNew) {
            ExpenseCategorySheet(model: model, category: nil) { container.toasts.info($0) }
        }
        .sheet(item: $editing) { category in
            ExpenseCategorySheet(model: model, category: category) { container.toasts.info($0) }
        }
    }
}
