import SwiftUI

/// Bottom sheet presenting shop expense metrics and filter controls.
/// Moves the total spend summary and category/recurring filter controls
/// out of the main list into a dedicated, roomy sheet.
struct ExpensesFilterSheet: View {
    @Bindable var model: ExpensesModel

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Summary Section
                    if let summary = model.summary {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(i18n.t("expenses.summaryTitle", default: "Expense Summary"))
                                .font(.headline)
                                .foregroundStyle(Tokens.ink)

                            AppCard(padding: 16) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(i18n.t("expenses.totalSpend", default: "Total Overhead Spend"))
                                        .font(.subheadline.weight(.medium))
                                        .foregroundStyle(.secondary)

                                    MoneyText(value: String(summary.total), size: 28)
                                        .foregroundStyle(Tokens.ink)

                                    Text(i18n.t("expenses.totalSpendDesc", default: "Recorded operational expenses for current period."))
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            if !summary.byCategory.isEmpty {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(i18n.t("expenses.byCategory", default: "Spend by Category"))
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(Tokens.ink)
                                        .padding(.top, 4)

                                    ForEach(summary.byCategory) { cat in
                                        HStack {
                                            Text(cat.name)
                                                .font(.subheadline)
                                                .foregroundStyle(Tokens.ink)
                                            Spacer()
                                            MoneyText(value: String(cat.total), size: 15)
                                                .foregroundStyle(.secondary)
                                        }
                                        .padding(.vertical, 4)
                                        Divider()
                                    }
                                }
                                .padding(16)
                                .background(Color(.secondarySystemGroupedBackground),
                                            in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
                            }
                        }
                    }

                    // Filters Section
                    VStack(alignment: .leading, spacing: 14) {
                        Text(i18n.t("common.filter", default: "Filters"))
                            .font(.headline)
                            .foregroundStyle(Tokens.ink)

                        // Category Picker
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("expenses.category", default: "Category"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)

                            Picker(i18n.t("expenses.category"), selection: Binding(
                                get: { model.categoryId },
                                set: { value in Task { await model.setCategory(value) } }
                            )) {
                                Text(i18n.t("common.all", default: "All Categories")).tag(String?.none)
                                ForEach(model.categories) { c in
                                    Text(c.name).tag(String?.some(c.id))
                                }
                            }
                            .pickerStyle(.menu)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(.secondarySystemBackground),
                                        in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))
                        }

                        // Recurring Filter
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("expenses.filterRecurring", default: "Expense Type"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)

                            Picker(i18n.t("expenses.filterRecurring"), selection: Binding(
                                get: { model.isRecurring },
                                set: { value in Task { await model.setRecurring(value) } }
                            )) {
                                Text(i18n.t("common.all", default: "All Types")).tag(Bool?.none)
                                Text(i18n.t("expenses.recurring", default: "Recurring Only")).tag(Bool?.some(true))
                                Text(i18n.t("expenses.oneOff", default: "One-off Only")).tag(Bool?.some(false))
                            }
                            .pickerStyle(.segmented)
                        }

                        if hasActiveFilters {
                            Button(role: .destructive) {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                Task {
                                    await model.setCategory(nil)
                                    await model.setRecurring(nil)
                                    dismiss()
                                }
                            } label: {
                                Label(i18n.t("inventory.clearFilters", default: "Reset All Filters"),
                                      systemImage: "arrow.counterclockwise")
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                            }
                            .buttonStyle(.bordered)
                            .tint(Tokens.danger)
                            .padding(.top, 4)
                        }
                    }
                    .padding(16)
                    .background(Color(.secondarySystemGroupedBackground),
                                in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(i18n.t("expenses.overviewTitle", default: "Overview & Filters"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.done", default: "Done")) {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        dismiss()
                    }
                    .font(.headline)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var hasActiveFilters: Bool {
        model.categoryId != nil || model.isRecurring != nil
    }
}

