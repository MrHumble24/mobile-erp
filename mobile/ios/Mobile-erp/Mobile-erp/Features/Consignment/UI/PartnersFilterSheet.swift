import SwiftUI

/// Bottom sheet presenting partner directory metrics and filter options.
/// Houses the summary metrics and filter controls, ensuring the main
/// partner directory screen remains clear, responsive, and uncluttered.
struct PartnersFilterSheet: View {
    @Bindable var model: PartnersListModel

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Summary metrics
                    PartnersSummary(model: model)

                    // Filters
                    VStack(alignment: .leading, spacing: 14) {
                        Text(i18n.t("common.filter", default: "Filters"))
                            .font(.headline)
                            .foregroundStyle(Tokens.ink)

                        // Status Filter
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("partners.status", default: "Partner Status"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)

                            Picker(i18n.t("partners.status"), selection: $model.active) {
                                ForEach(PartnersListModel.ActiveFilter.allCases) { a in
                                    Text(label(a)).tag(a)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        // Overdue only toggle
                        Toggle(isOn: $model.overdueOnly) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(i18n.t("partners.overdueOnly", default: "Overdue Debt Only"))
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(Tokens.ink)
                                Text(i18n.t("partners.overdueDesc", default: "Show only partners with outstanding overdue balances"))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .tint(Tokens.danger)
                        .padding(.vertical, 4)

                        if hasActiveFilters {
                            Button(role: .destructive) {
                                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                                model.active = .all
                                model.overdueOnly = false
                                dismiss()
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
            .navigationTitle(i18n.t("partners.overviewTitle", default: "Overview & Filters"))
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
        model.active != .all || model.overdueOnly
    }

    private func label(_ a: PartnersListModel.ActiveFilter) -> String {
        switch a {
        case .all: return i18n.t("common.all", default: "All")
        case .active: return i18n.t("partners.active", default: "Active")
        case .inactive: return i18n.t("partners.inactive", default: "Inactive")
        }
    }
}

