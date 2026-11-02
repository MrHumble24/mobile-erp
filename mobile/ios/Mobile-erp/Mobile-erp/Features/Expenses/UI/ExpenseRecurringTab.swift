import SwiftUI

/// Recurring expense templates: list, create/edit, pause/resume and
/// generate-due (web `ExpenseRecurringTab`). All writes online-only, gated by
/// `expense.manage`.
struct ExpenseRecurringTab: View {
    let categories: [ExpenseCategory]
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n

    @State private var rows: [ExpenseRecurrence] = []
    @State private var error: String?
    @State private var loaded = false
    @State private var editing: ExpenseRecurrence?
    @State private var showNew = false

    private var canManage: Bool { container.session.can("expense.manage") }
    private var repo: ExpenseRecurrencesRepository { ExpenseRecurrencesRepository(api: container.api) }

    var body: some View {
        List {
            if let error, rows.isEmpty {
                ErrorStateView(message: error) { Task { await load() } }
            } else if rows.isEmpty && loaded {
                EmptyStateView(systemImage: "repeat", title: i18n.t("expenses.noRecurrences"))
            } else {
                ForEach(rows) { row in RecurrenceRow(row: row, canManage: canManage,
                                                     onEdit: { editing = row }, onToggle: { toggle(row) }) }
            }
        }
        .listStyle(.insetGrouped)
        .toolbar {
            if canManage {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { Task { await generate() } } label: { Image(systemName: "arrow.clockwise") }
                        .accessibilityLabel(i18n.t("expenses.generateDue"))
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showNew = true } label: { Image(systemName: "plus") }
                        .accessibilityLabel(i18n.t("expenses.newRecurrence"))
                }
            }
        }
        .task { if !loaded { await load() } }
        .sheet(isPresented: $showNew) {
            ExpenseRecurrenceSheet(categories: categories, recurrence: nil) { await reload($0) }
        }
        .sheet(item: $editing) { row in
            ExpenseRecurrenceSheet(categories: categories, recurrence: row) { await reload($0) }
        }
    }

    private func load() async {
        error = nil
        do { rows = try await repo.list(); loaded = true }
        catch let e as AppError { error = e.message }
        catch { self.error = error.localizedDescription }
    }

    private func reload(_ message: String?) async {
        if let message { container.toasts.info(message) }
        await load()
    }

    private func generate() async {
        guard container.connectivity.isOnline else {
            container.toasts.info(i18n.t("common.offline", default: "No connection.")); return
        }
        do {
            let result = try await repo.generateDue()
            container.toasts.success(i18n.t("expenses.generated", ["count": String(result.generated)]))
            await load()
        } catch let e as AppError { container.toasts.error(e.message) }
        catch { container.toasts.error(error.localizedDescription) }
    }

    private func toggle(_ row: ExpenseRecurrence) {
        guard container.connectivity.isOnline else {
            container.toasts.info(i18n.t("common.offline", default: "No connection.")); return
        }
        Task {
            do {
                try await repo.update(id: row.id, UpdateExpenseRecurrenceDto(
                    categoryId: nil, amount: nil, description: nil, vendor: nil,
                    frequency: nil, nextDueAt: nil, isActive: !row.isActive))
                await load()
            } catch let e as AppError { container.toasts.error(e.message) }
            catch { container.toasts.error(error.localizedDescription) }
        }
    }
}

private struct RecurrenceRow: View {
    let row: ExpenseRecurrence
    let canManage: Bool
    let onEdit: () -> Void
    let onToggle: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(row.categoryName).font(.body)
                Text("\(i18n.t(freqKey)) · \(i18n.t("expenses.nextDueAt")): \(ExpenseDate.display(row.nextDueAt))")
                    .font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            MoneyText(value: row.amount, size: 15)
            if canManage {
                Button(action: onToggle) {
                    Image(systemName: row.isActive ? "pause.circle" : "play.circle")
                }.buttonStyle(.plain).foregroundStyle(Tokens.slate)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture { if canManage { onEdit() } }
    }

    private var freqKey: String {
        row.frequency == "weekly" ? "expenses.frequencyWeekly" : "expenses.frequencyMonthly"
    }
}
