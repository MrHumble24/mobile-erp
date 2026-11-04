import SwiftUI

/// Recurring expense templates: one card per template (category, cadence ·
/// next due, amount, active pill) with edit / pause pills, plus new and
/// generate-due in the toolbar. All writes online-only, `expense.manage`.
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
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let error, rows.isEmpty {
                    AppCard { ErrorStateView(message: error) { Task { await load() } } }
                } else if rows.isEmpty && loaded {
                    AppCard { EmptyStateView(systemImage: "repeat", title: i18n.t("expenses.noRecurrences")) }
                } else if !loaded {
                    AppCard { LoadingView().frame(height: 120) }
                } else {
                    ForEach(rows) { row in
                        RecurrenceCard(row: row, canManage: canManage, onEdit: { editing = row }, onToggle: { toggle(row) })
                    }
                }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .toolbar {
            if canManage {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { Task { await generate() } } label: {
                        Label(i18n.t("expenses.generateDue"), systemImage: "arrow.clockwise")
                    }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button { showNew = true } label: { Label(i18n.t("expenses.newRecurrence"), systemImage: "plus") }
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
        guard container.connectivity.isOnline else { container.toasts.info(i18n.t("common.offline")); return }
        do {
            let result = try await repo.generateDue()
            container.toasts.success(i18n.t("expenses.generated", ["count": String(result.generated)]))
            await load()
        } catch let e as AppError { container.toasts.error(e.message) }
        catch { container.toasts.error(error.localizedDescription) }
    }

    private func toggle(_ row: ExpenseRecurrence) {
        guard container.connectivity.isOnline else { container.toasts.info(i18n.t("common.offline")); return }
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

private struct RecurrenceCard: View {
    let row: ExpenseRecurrence
    let canManage: Bool
    let onEdit: () -> Void
    let onToggle: () -> Void
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            VStack(alignment: .leading, spacing: Tokens.Space.md) {
                HStack(alignment: .top, spacing: Tokens.Space.sm) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(row.categoryName).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                        Text("\(i18n.t(freqKey)) · \(KitDate.day(row.nextDueAt))").font(.ui(.caption)).foregroundStyle(Tokens.muted)
                        if let d = row.description, !d.isEmpty {
                            Text(d).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                        }
                    }
                    Spacer(minLength: Tokens.Space.sm)
                    VStack(alignment: .trailing, spacing: Tokens.Space.xs) {
                        MoneyText(value: row.amount, size: 15).fontWeight(.semibold).foregroundStyle(Tokens.text)
                        StatusBadge(i18n.t(row.isActive ? "expenses.recurrenceActive" : "expenses.markInactive"),
                                    color: row.isActive ? Tokens.success : Tokens.sold)
                    }
                }
                if canManage {
                    HStack(spacing: Tokens.Space.sm) {
                        Button(action: onEdit) { Text(i18n.t("common.edit")).frame(maxWidth: .infinity) }
                            .buttonStyle(.pillSecondary)
                        Button(action: onToggle) {
                            Text(i18n.t(row.isActive ? "expenses.markInactive" : "expenses.markActive")).frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.pillGhost)
                    }
                }
            }
        }
    }

    private var freqKey: String { row.frequency == "weekly" ? "expenses.frequencyWeekly" : "expenses.frequencyMonthly" }
}
