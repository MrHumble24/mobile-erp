import SwiftUI

/// Read-only expense detail (web `ExpenseDetailSheet`): the amount, category,
/// date, vendor, notes, recurring flag and who recorded it — plus an Edit
/// action for `expense.manage` users.
struct ExpenseDetailSheet: View {
    let id: String
    let canManage: Bool
    var onEdit: (Expense) -> Void

    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var expense: Expense?
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                if let expense {
                    body(expense)
                } else if let error {
                    ErrorStateView(message: error) { Task { await load() } }
                } else {
                    LoadingView().frame(height: 200)
                }
            }
            .navigationTitle(i18n.t("expenses.detailTitle"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.close")) { dismiss() }
                }
            }
        }
        .task { await load() }
    }

    @ViewBuilder private func body(_ expense: Expense) -> some View {
        VStack(spacing: 16) {
            AppCard {
                MoneyText(value: expense.amount, size: 32)
                    .foregroundStyle(Tokens.danger)
                    .frame(maxWidth: .infinity)
            }
            AppCard {
                VStack(spacing: 0) {
                    row(i18n.t("expenses.category"), expense.categoryName)
                    row(i18n.t("expenses.incurredAt"), ExpenseDate.display(expense.incurredAt))
                    row(i18n.t("expenses.vendor"), expense.vendor ?? "—")
                    row(i18n.t("expenses.description"), expense.description ?? "—")
                    row(i18n.t("expenses.isRecurring"), expense.isRecurring ? i18n.t("common.yes") : i18n.t("common.no"))
                    row(i18n.t("expenses.recordedBy"), expense.createdBy?.displayName ?? "—", last: true)
                }
            }
            if canManage {
                Button {
                    onEdit(expense)
                } label: {
                    Label(i18n.t("common.edit"), systemImage: "pencil")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
    }

    private func row(_ label: String, _ value: String, last: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top) {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text(value).font(.subheadline).multilineTextAlignment(.trailing)
            }
            .padding(.vertical, 8)
            if !last { Divider() }
        }
    }

    private func load() async {
        error = nil
        do { expense = try await ExpensesRepository(api: container.api).get(id: id) }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }
}
