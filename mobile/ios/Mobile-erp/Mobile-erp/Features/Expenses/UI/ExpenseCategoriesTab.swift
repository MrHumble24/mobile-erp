import SwiftUI

/// Expense categories as one card of hairline rows (name, description,
/// inactive pill), plus add / edit for `expense.category.manage` users.
struct ExpenseCategoriesTab: View {
    let model: ExpensesModel
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var editing: ExpenseCategory?
    @State private var showNew = false

    private var canManage: Bool { container.session.can("expense.category.manage") }

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if model.categories.isEmpty {
                    AppCard { EmptyStateView(systemImage: "tag", title: i18n.t("common.notFound")) }
                } else {
                    AppCard(padding: 0) {
                        VStack(spacing: 0) {
                            ForEach(Array(model.categories.enumerated()), id: \.element.id) { i, category in
                                row(category)
                                if i < model.categories.count - 1 { Divider().overlay(Tokens.border) }
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .toolbar {
            if canManage {
                ToolbarItem(placement: .primaryAction) {
                    Button { showNew = true } label: { Label(i18n.t("expenses.newCategory"), systemImage: "plus") }
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

    private func row(_ category: ExpenseCategory) -> some View {
        HStack(spacing: Tokens.Space.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text(category.name).font(.ui(.body)).foregroundStyle(Tokens.text)
                if let d = category.description, !d.isEmpty {
                    Text(d).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
            }
            Spacer(minLength: Tokens.Space.sm)
            if !category.isActive {
                StatusBadge(i18n.t("expenses.markInactive"), color: Tokens.sold)
            }
            if canManage {
                Image(systemName: "chevron.right").font(.system(size: 13, weight: .semibold)).foregroundStyle(Tokens.muted)
            }
        }
        .frame(minHeight: Tokens.Space.rowH)
        .padding(.horizontal, Tokens.Space.cardPad)
        .padding(.vertical, Tokens.Space.sm)
        .contentShape(Rectangle())
        .onTapGesture { if canManage { editing = category } }
    }
}
