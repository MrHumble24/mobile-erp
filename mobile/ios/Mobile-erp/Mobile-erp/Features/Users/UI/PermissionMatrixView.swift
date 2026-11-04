import SwiftUI

/// Permission matrix tab: pick a role, toggle its permissions (one card per
/// resource with switch rows), save with the sticky bottom pill. System roles
/// are read-only. Needs `role.manage`; saving is online-only.
struct PermissionMatrixView: View {
    @Environment(I18n.self) private var i18n
    @Bindable var catalog: UsersCatalog
    @State private var roleCode = ""
    @State private var selected: Set<String> = []
    @State private var baseline: Set<String> = []

    private var role: RoleView? { catalog.roles.first { $0.code == roleCode } ?? catalog.roles.first }
    private var dirty: Bool { selected != baseline }

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                AppFormField(label: i18n.t("users.selectRole")) {
                    AppSelect(placeholder: i18n.t("users.selectRole"), selection: $roleCode,
                              options: catalog.roles.map { ($0.code, "\($0.name) · \($0.code)") })
                }
                if let role {
                    if role.isSystem { FormErrorLine(message: i18n.t("users.systemRoleMatrixLocked"), color: Tokens.muted) }
                    ForEach(groupByResource(catalog.permissions), id: \.resource) { group in
                        groupCard(group.resource, group.items, locked: role.isSystem)
                    }
                }
                if let err = catalog.actionError { FormErrorLine(message: err) }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .safeAreaInset(edge: .bottom) { saveBar }
        .onAppear { if roleCode.isEmpty { reset(to: role) } }
        .onChange(of: roleCode) { _, _ in reset(to: role) }
    }

    private func groupCard(_ resource: String, _ items: [PermissionView], locked: Bool) -> some View {
        let granted = items.filter { selected.contains($0.code) }.count
        return AppCard {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(resource.uppercased()).font(.ui(.label)).foregroundStyle(Tokens.muted)
                    Spacer()
                    Text("\(granted)/\(items.count)").font(.mono(12, weight: .semibold)).foregroundStyle(Tokens.muted)
                }
                .padding(.bottom, Tokens.Space.sm)
                ForEach(Array(items.enumerated()), id: \.element.id) { i, permission in
                    Toggle(isOn: Binding(get: { selected.contains(permission.code) },
                                         set: { on in if on { selected.insert(permission.code) } else { selected.remove(permission.code) } })) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(permission.code).font(.data(.regular)).foregroundStyle(Tokens.text)
                            if let d = permission.description, !d.isEmpty {
                                Text(d).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                            }
                        }
                    }
                    .disabled(locked)
                    .frame(minHeight: Tokens.Space.minTouch)
                    if i < items.count - 1 { Divider().overlay(Tokens.border) }
                }
            }
        }
    }

    @ViewBuilder private var saveBar: some View {
        if let role, !role.isSystem, dirty {
            HStack(spacing: Tokens.Space.sm) {
                Button { Haptic.tick.play(); selected = baseline } label: {
                    Text(i18n.t("common.cancel")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillSecondary)
                Button {
                    Haptic.tick.play()
                    Task {
                        let ok = await catalog.setRolePermissions(role.code, permissionCodes: Array(selected))
                        if ok { baseline = selected }
                    }
                } label: {
                    Text(i18n.t("users.saveMatrix")).frame(maxWidth: .infinity)
                }
                .buttonStyle(.pillPrimary)
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.vertical, Tokens.Space.md)
            .background(Tokens.ground)
        }
    }

    private func reset(to role: RoleView?) {
        roleCode = role?.code ?? ""
        let codes = Set(role?.permissionCodes ?? [])
        selected = codes
        baseline = codes
    }
}
