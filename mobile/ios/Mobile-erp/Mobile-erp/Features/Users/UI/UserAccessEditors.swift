import SwiftUI

/// Role assignment for one user: a toggle per role, saved as a set. Locked for
/// self-edits (`selfRolesLocked`).
struct UserRolesEditor: View {
    @Environment(I18n.self) private var i18n
    @Bindable var model: UserDetailModel
    let catalog: UsersCatalog

    var body: some View {
        if model.isSelf {
            Section { note(i18n.t("users.selfRolesLocked")) }
        }
        Section(i18n.t("users.roles")) {
            ForEach(catalog.roles) { role in
                Toggle(role.name, isOn: Binding(
                    get: { model.selectedRoles.contains(role.code) },
                    set: { _ in model.toggleRole(role.code) }))
                    .disabled(model.isSelf)
            }
        }
        Section {
            Button(i18n.t("users.saveRoles")) {
                Task { await model.saveRoles(savedMessage: i18n.t("users.rolesSaved")) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(model.isSelf || !model.rolesDirty)
        }
    }

    private func note(_ text: String) -> some View {
        Text(text).font(.footnote).foregroundStyle(.secondary)
    }
}

/// Per-user permission overrides: inherit / grant / revoke per permission,
/// grouped by resource, with the role-grant source shown. Locked for
/// self-edits (`selfPermsLocked`).
struct UserOverridesEditor: View {
    @Environment(I18n.self) private var i18n
    @Bindable var model: UserDetailModel
    let catalog: UsersCatalog

    var body: some View {
        if model.isSelf {
            Section { Text(i18n.t("users.selfPermsLocked")).font(.footnote).foregroundStyle(.secondary) }
        }
        ForEach(groupByResource(catalog.permissions), id: \.resource) { group in
            Section(group.resource.uppercased()) {
                ForEach(group.items) { permission in
                    OverrideRow(
                        permission: permission,
                        state: binding(for: permission.code),
                        roleCodes: model.roleGrantCodes(for: permission.code),
                        disabled: model.isSelf)
                }
            }
        }
        Section {
            Button(i18n.t("common.save")) {
                Task { await model.saveOverrides(savedMessage: i18n.t("users.overridesSaved")) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(model.isSelf || !model.overridesDirty)
        }
    }

    private func binding(for code: String) -> Binding<OverrideState> {
        Binding(
            get: { model.overrides[code] ?? .inherit },
            set: { model.overrides[code] = $0 })
    }
}

/// One override row: the permission code (mono), its current source, and an
/// inherit / grant / revoke picker.
private struct OverrideRow: View {
    @Environment(I18n.self) private var i18n
    let permission: PermissionView
    @Binding var state: OverrideState
    let roleCodes: [String]
    let disabled: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(permission.code).font(.mono(13, weight: .medium))
            Text(sourceLabel).font(.caption2).foregroundStyle(.secondary)
            Picker("", selection: $state) {
                Text(i18n.t("users.overrideInherit")).tag(OverrideState.inherit)
                Text(i18n.t("users.overrideGrant")).tag(OverrideState.grant)
                Text(i18n.t("users.overrideRevoke")).tag(OverrideState.revoke)
            }
            .pickerStyle(.segmented)
            .disabled(disabled)
        }
        .padding(.vertical, 2)
    }

    private var sourceLabel: String {
        switch state {
        case .grant: return i18n.t("users.sourceUserGrant")
        case .revoke: return i18n.t("users.sourceUserRevoke")
        case .inherit:
            return roleCodes.isEmpty
                ? i18n.t("users.sourceNone")
                : i18n.t("users.sourceRoles", ["roles": roleCodes.joined(separator: ", ")])
        }
    }
}
