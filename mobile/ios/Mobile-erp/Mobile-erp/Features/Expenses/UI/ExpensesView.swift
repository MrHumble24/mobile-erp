import SwiftUI

/// Shop expenses, matching the web tab set: Expenses list · Categories ·
/// Recurring templates. A segmented control switches tabs; each tab owns its
/// own toolbar actions. All writes are online-only and permission-gated.
struct ExpensesView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var model = ExpensesModel()
    @State private var tab: ExpenseScreenTab = .expenses

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $tab) {
                ForEach(ExpenseScreenTab.allCases) { t in
                    Text(i18n.t(t.labelKey)).tag(t)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)

            content
        }
        .navigationTitle(i18n.t("expenses.title"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            model.bind(container)
            if model.summary == nil { await model.load() }
        }
    }

    @ViewBuilder private var content: some View {
        switch tab {
        case .expenses: ExpensesListTab(model: model)
        case .categories: ExpenseCategoriesTab(model: model)
        case .recurring: ExpenseRecurringTab(categories: model.activeCategories)
        }
    }
}

enum ExpenseScreenTab: String, CaseIterable, Identifiable {
    case expenses, categories, recurring
    var id: String { rawValue }
    var labelKey: String {
        switch self {
        case .expenses: "expenses.tabExpenses"
        case .categories: "expenses.tabCategories"
        case .recurring: "expenses.tabRecurring"
        }
    }
}
