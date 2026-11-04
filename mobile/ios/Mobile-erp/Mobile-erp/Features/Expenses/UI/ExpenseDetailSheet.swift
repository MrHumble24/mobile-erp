import SwiftUI

/// Expense detail as a Warm Card sheet: category title, keyed facts (amount,
/// date, vendor, recurring, notes, recorded by), then edit (secondary) and
/// delete (destructive) for `expense.manage`. Loads the record by id.
struct ExpenseDetailSheet: View {
    let id: String
    let canManage: Bool
    var onEdit: (Expense) -> Void
    var onDelete: (Expense) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss
    @State private var expense: Expense?
    @State private var error: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.lg) {
                SheetTitleRow(title: expense?.categoryName ?? i18n.t("expenses.detailTitle")) { dismiss() }
                if let expense {
                    facts(expense)
                    if canManage {
                        VStack(spacing: Tokens.Space.sm) {
                            Button { onEdit(expense) } label: {
                                Text(i18n.t("expenses.editExpense")).frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.pillSecondary)
                            Button { onDelete(expense) } label: {
                                Text(i18n.t("expenses.deleteExpense")).frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.pillDestructive)
                        }
                    }
                } else if let error {
                    ErrorStateView(message: error) { Task { await load() } }
                } else {
                    LoadingView().frame(height: 160)
                }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Tokens.card)
        .presentationDetents([.large])
        .task { await load() }
    }

    private func facts(_ e: Expense) -> some View {
        VStack(spacing: 0) {
            FactRow(label: i18n.t("expenses.amount")) { MoneyText(value: e.amount, size: 15) }
            FactRow(label: i18n.t("expenses.incurredAt")) { Text(KitDate.day(e.incurredAt)).font(.data(.regular)) }
            FactRow(label: i18n.t("expenses.vendor")) { Text(e.vendor?.isEmpty == false ? e.vendor! : "—").font(.ui(.body)) }
            FactRow(label: i18n.t("expenses.isRecurring")) { Text(i18n.t(e.isRecurring ? "common.yes" : "common.no")).font(.ui(.body)) }
            if let d = e.description, !d.isEmpty {
                FactRow(label: i18n.t("expenses.description")) { Text(d).font(.ui(.body)) }
            }
            FactRow(label: i18n.t("expenses.recordedBy"), last: true) { Text(e.createdBy?.displayName ?? "—").font(.ui(.body)) }
        }
    }

    private func load() async {
        error = nil
        do { expense = try await ExpensesRepository(api: container.api).get(id: id) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
