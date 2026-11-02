import SwiftUI

/// Permission matrix tab: pick a role, toggle its permissions (grouped by
/// resource), save. System roles are read-only. Needs `role.manage`;
/// saving is online-only.
struct PermissionMatrixView: View {
    @Environment(I18n.self) private var i18n
    @Bindable var catalog: UsersCatalog

    @State private var roleCode = ""
    @State private var selected: Set<String> = []
    @State private var baseline: Set<String> = []

    private var role: RoleView? {
        catalog.roles.first { $0.code == roleCode } ?? catalog.roles.first
    }

    private var dirty: Bool { selected != baseline }

    var body: some View {
        List {
            Section {
                Picker(i18n.t("users.selectRole"), selection: $roleCode) {
                    ForEach(catalog.roles) { Text("\($0.name) (\($0.code))").tag($0.code) }
                }
            }
            if let role {
                if role.isSystem {
                    Section { note(i18n.t("users.systemRoleMatrixLocked")) }
                }
                groups(role)
            }
            if let err = catalog.actionError {
                Section {
                    Label(err, systemImage: "exclamationmark.triangle")
                        .font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
        }
        .safeAreaInset(edge: .bottom) { saveBar }
        .onAppear { if roleCode.isEmpty { reset(to: role) } }
        .onChange(of: roleCode) { _, _ in reset(to: role) }
    }

    @ViewBuilder private func groups(_ role: RoleView) -> some View {
        ForEach(groupByResource(catalog.permissions), id: \.resource) { group in
            Section(group.resource.uppercased()) {
                ForEach(group.items) { permission in
                    Toggle(isOn: Binding(
                        get: { selected.contains(permission.code) },
                        set: { on in
                            if on { selected.insert(permission.code) }
                            else { selected.remove(permission.code) }
                        })) {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(permission.code).font(.mono(13))
                            if let d = permission.description, !d.isEmpty {
                                Text(d).font(.caption2).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .disabled(role.isSystem)
                }
            }
        }
    }

    @ViewBuilder private var saveBar: some View {
        if let role, !role.isSystem, dirty {
            HStack {
                Button(i18n.t("common.cancel")) { selected = baseline }
                    .buttonStyle(.bordered)
                Spacer()
                Button(i18n.t("users.saveMatrix")) {
                    Task {
                        let ok = await catalog.setRolePermissions(role.code, permissionCodes: Array(selected))
                        if ok { baseline = selected }
                    }
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
            .background(.bar)
        }
    }

    private func reset(to role: RoleView?) {
        roleCode = role?.code ?? ""
        let codes = Set(role?.permissionCodes ?? [])
        selected = codes
        baseline = codes
    }

    private func note(_ text: String) -> some View {
        Text(text).font(.footnote).foregroundStyle(.secondary)
    }
}
