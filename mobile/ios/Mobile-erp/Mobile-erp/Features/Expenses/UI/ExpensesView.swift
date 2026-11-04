import SwiftUI

/// Shop expenses, matching the web tab set: Expenses list · Categories ·
/// Recurring templates, switched by the kit segmented control. Each tab owns
/// its toolbar actions. All writes are online-only and permission-gated.
/// Title is the tab label (`nav.expenses`), the same string as Android.
struct ExpensesView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = ExpensesModel()
    @State private var tab: ExpenseScreenTab = .expenses

    var body: some View {
        VStack(spacing: 0) {
            SegmentedControl(selection: $tab, segments: ExpenseScreenTab.allCases.map { ($0, i18n.t($0.labelKey)) })
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.md)
            content
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("nav.expenses"))
        .task {
            model.bind(container)
            if model.summary == nil { await model.load() }
            #if DEBUG
            // Screenshot helper: `-openTab expenses|categories|recurring`.
            if let raw = KitDebugLaunch.consume("openTab", accept: { ExpenseScreenTab(rawValue: $0) != nil }), let t = ExpenseScreenTab(rawValue: raw) { tab = t }
            #endif
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
