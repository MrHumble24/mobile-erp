import SwiftUI

/// Role assignment for one user: switch rows, saved as a set. Locked for
/// self-edits (`selfRolesLocked`).
struct UserRolesEditor: View {
    @Environment(I18n.self) private var i18n
    @Bindable var model: UserDetailModel
    let catalog: UsersCatalog

    var body: some View {
        if model.isSelf { FormErrorLine(message: i18n.t("users.selfRolesLocked"), color: Tokens.muted) }
        RoleSwitches(roles: catalog.roles,
                     selected: Binding(get: { Set(model.selectedRoles) }, set: { model.selectedRoles = Array($0) }),
                     disabled: model.isSelf)
        Button { Task { await model.saveRoles(savedMessage: i18n.t("users.rolesSaved")) } } label: {
            Text(i18n.t("users.saveRoles")).frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillPrimary)
        .disabled(model.isSelf || !model.rolesDirty)
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
        if model.isSelf { FormErrorLine(message: i18n.t("users.selfPermsLocked"), color: Tokens.muted) }
        ForEach(groupByResource(catalog.permissions), id: \.resource) { group in
            VStack(alignment: .leading, spacing: Tokens.Space.sm) {
                Text(group.resource.uppercased()).font(.ui(.label)).foregroundStyle(Tokens.muted)
                ForEach(group.items) { permission in
                    OverrideRow(permission: permission, state: binding(for: permission.code),
                                roleCodes: model.roleGrantCodes(for: permission.code), disabled: model.isSelf)
                }
            }
        }
        Button { Task { await model.saveOverrides(savedMessage: i18n.t("users.overridesSaved")) } } label: {
            Text(i18n.t("common.save")).frame(maxWidth: .infinity)
        }
        .buttonStyle(.pillPrimary)
        .disabled(model.isSelf || !model.overridesDirty)
    }

    private func binding(for code: String) -> Binding<OverrideState> {
        Binding(get: { model.overrides[code] ?? .inherit }, set: { model.overrides[code] = $0 })
    }
}

/// One override row as a surface-2 block: mono code, its source, and the
/// inherit / grant / revoke segmented control.
private struct OverrideRow: View {
    @Environment(I18n.self) private var i18n
    let permission: PermissionView
    @Binding var state: OverrideState
    let roleCodes: [String]
    let disabled: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(permission.code).font(.data(.regular)).foregroundStyle(Tokens.text)
            Text(sourceLabel).font(.ui(.caption)).foregroundStyle(sourceColor)
            SegmentedControl(selection: $state, segments: [
                (.inherit, i18n.t("users.overrideInherit")),
                (.grant, i18n.t("users.overrideGrant")),
                (.revoke, i18n.t("users.overrideRevoke")),
            ])
            .disabled(disabled)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Tokens.Space.md)
        .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: Tokens.Radius.controls, style: .continuous))
    }

    private var sourceLabel: String {
        switch state {
        case .grant: return i18n.t("users.sourceUserGrant")
        case .revoke: return i18n.t("users.sourceUserRevoke")
        case .inherit:
            return roleCodes.isEmpty ? i18n.t("users.sourceNone") : i18n.t("users.sourceRoles", ["roles": roleCodes.joined(separator: ", ")])
        }
    }

    private var sourceColor: Color {
        switch state {
        case .grant: return Tokens.success
        case .revoke: return Tokens.danger
        case .inherit: return roleCodes.isEmpty ? Tokens.muted : Tokens.info
        }
    }
}
