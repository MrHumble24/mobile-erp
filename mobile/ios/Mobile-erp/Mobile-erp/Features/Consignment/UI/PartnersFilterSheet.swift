import SwiftUI

/// Dedicated bottom sheet presenting partner directory filter options.
/// Focused purely on filtering (active status, overdue debts) without clutter.
struct PartnersFilterSheet: View {
    @Bindable var model: PartnersListModel

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section(i18n.t("partners.status", default: "Hamkor holati")) {
                    Picker(i18n.t("partners.status"), selection: $model.active) {
                        ForEach(PartnersListModel.ActiveFilter.allCases) { a in
                            Text(label(a)).tag(a)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section {
                    Toggle(isOn: $model.overdueOnly) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(i18n.t("partners.overdueOnly", default: "Muddati o'tgan qarzlar"))
                                .font(.subheadline.weight(.medium))
                            Text(i18n.t("partners.overdueDesc", default: "Muddati o'tgan qarzdorligi bor hamkorlar"))
                                .font(.caption)
                                .foregroundStyle(Tokens.muted)
                        }
                    }
                    .tint(Tokens.danger)
                }

                if hasActiveFilters {
                    Section {
                        Button(role: .destructive) {
                            Haptic.tick.play()
                            model.active = .all
                            model.overdueOnly = false
                            dismiss()
                        } label: {
                            Label(i18n.t("inventory.clearFilters", default: "Filtrlarni tozalash"),
                                  systemImage: "arrow.counterclockwise")
                                .foregroundStyle(Tokens.danger)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                    }
                }
            }
            .navigationTitle(i18n.t("common.filter", default: "Filtrlar"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(i18n.t("common.done", default: "Done")) {
                        Haptic.tick.play()
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
        case .all: return i18n.t("common.all", default: "Barchasi")
        case .active: return i18n.t("partners.active", default: "Faol")
        case .inactive: return i18n.t("partners.inactive", default: "Nofaol")
        }
    }
}
