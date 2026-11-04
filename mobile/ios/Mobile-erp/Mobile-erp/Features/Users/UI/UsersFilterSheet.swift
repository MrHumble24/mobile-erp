import SwiftUI

/// Bottom sheet presenting staff account stats and filter controls.
/// Moves staff metrics and role/status pickers out of the main employee directory.
struct UsersFilterSheet: View {
    @Bindable var model: UsersListModel
    let catalog: UsersCatalog

    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Staff Stats Overview
                    if let stats = model.stats {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(i18n.t("users.staffOverview", default: "Staff Directory Overview"))
                                .font(.headline)
                                .foregroundStyle(Tokens.ink)

                            VStack(spacing: 10) {
                                AppCard(padding: 16) {
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(i18n.t("users.statTotal", default: "Total Staff Accounts"))
                                            .font(.subheadline)
                                            .foregroundStyle(Tokens.muted)
                                        Text("\(stats.total)")
                                            .font(.system(size: 28, weight: .bold))
                                            .foregroundStyle(Tokens.ink)
                                            .monospacedDigit()
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }

                                HStack(spacing: 12) {
                                    AppCard(
                                        padding: 14,
                                        backgroundColor: Tokens.okBg,
                                        borderColor: Tokens.success.opacity(0.25)
                                    ) {
                                        VStack(alignment: .leading, spacing: 4) {
                                            HStack(spacing: 6) {
                                                Circle().fill(Tokens.success).frame(width: 8, height: 8)
                                                Text(i18n.t("users.statActive", default: "Active"))
                                                    .font(.caption.weight(.medium))
                                                    .foregroundStyle(Tokens.muted)
                                            }
                                            Text("\(stats.active)")
                                                .font(.title3.weight(.bold))
                                                .foregroundStyle(Tokens.success)
                                                .monospacedDigit()
                                        }
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                    }

                                    let inactiveCount = max(0, stats.total - stats.active)
                                    AppCard(
                                        padding: 14,
                                        backgroundColor: Tokens.surface2,
                                        borderColor: Tokens.slate.opacity(0.25)
                                    ) {
                                        VStack(alignment: .leading, spacing: 4) {
                                            HStack(spacing: 6) {
                                                Circle().fill(Tokens.slate).frame(width: 8, height: 8)
                                                Text(i18n.t("users.statInactive", default: "Inactive"))
                                                    .font(.caption.weight(.medium))
                                                    .foregroundStyle(Tokens.muted)
                                            }
                                            Text("\(inactiveCount)")
                                                .font(.title3.weight(.bold))
                                                .foregroundStyle(Tokens.slate)
                                                .monospacedDigit()
                                        }
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                    }
                                }
                            }
                        }
                    }

                    // Filter Options
                    VStack(alignment: .leading, spacing: 14) {
                        Text(i18n.t("common.filter", default: "Filter Staff"))
                            .font(.headline)
                            .foregroundStyle(Tokens.ink)

                        // Role Picker
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("users.filterRole", default: "Assigned Role"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(Tokens.muted)

                            Picker(i18n.t("users.filterRole"), selection: $model.roleFilter) {
                                Text(i18n.t("common.all", default: "All Roles")).tag("")
                                ForEach(catalog.roles) { role in
                                    Text(role.name).tag(role.code)
                                }
                            }
                            .pickerStyle(.menu)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Tokens.surface2,
                                        in: RoundedRectangle(cornerRadius: Tokens.Radius.inputs, style: .continuous))
                            .onChange(of: model.roleFilter) { model.onFilterChange() }
                        }

                        // Status Picker
                        VStack(alignment: .leading, spacing: 6) {
                            Text(i18n.t("users.filterStatus", default: "Account Status"))
                                .font(.caption.weight(.medium))
                                .foregroundStyle(Tokens.muted)

                            Picker(i18n.t("users.filterStatus"), selection: $model.activeFilter) {
                                Text(i18n.t("common.all", default: "All Statuses")).tag("")
                                Text(i18n.t("users.statusActive", default: "Active Only")).tag("active")
                                Text(i18n.t("users.statusInactive", default: "Inactive Only")).tag("inactive")
                            }
                            .pickerStyle(.segmented)
                            .onChange(of: model.activeFilter) { model.onFilterChange() }
                        }

                        if hasActiveFilters {
                            Button(role: .destructive) {
                                Haptic.tick.play()
                                model.roleFilter = ""
                                model.activeFilter = ""
                                model.onFilterChange()
                                dismiss()
                            } label: {
                                Label(i18n.t("users.resetFilters", default: "Reset All Filters"),
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
                    .background(Tokens.surface,
                                in: RoundedRectangle(cornerRadius: Tokens.Radius.cards, style: .continuous))
                }
                .padding(16)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(i18n.t("users.filterTitle", default: "Overview & Filters"))
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
        !model.roleFilter.isEmpty || !model.activeFilter.isEmpty
    }
}

