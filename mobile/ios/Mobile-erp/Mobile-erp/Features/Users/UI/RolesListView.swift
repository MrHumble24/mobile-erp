import SwiftUI

/// Roles tab: the role list with create / rename / delete. System roles are
/// locked from deletion. Permission editing lives in the matrix tab. All writes
/// need `role.manage` and are online-only.
struct RolesListView: View {
    @Environment(I18n.self) private var i18n
    @Bindable var catalog: UsersCatalog

    @State private var createOpen = false
    @State private var editing: RoleView?
    @State private var pendingDelete: RoleView?

    var body: some View {
        List {
            if let err = catalog.actionError {
                Section {
                    Label(err, systemImage: "exclamationmark.triangle")
                        .font(.footnote).foregroundStyle(Tokens.danger)
                }
            }
            Section {
                ForEach(catalog.roles) { role in
                    Button { editing = role } label: { RoleRow(role: role) }
                        .buttonStyle(.plain)
                        .swipeActions {
                            if !role.isSystem {
                                Button(i18n.t("common.delete"), role: .destructive) {
                                    pendingDelete = role
                                }
                            }
                        }
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { createOpen = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $createOpen) { CreateRoleSheet(catalog: catalog) }
        .sheet(item: $editing) { role in EditRoleSheet(catalog: catalog, role: role) }
        .confirmationDialog(
            i18n.t("users.confirmDeleteRole", ["role": pendingDelete?.name ?? ""]),
            isPresented: Binding(get: { pendingDelete != nil },
                                 set: { if !$0 { pendingDelete = nil } }),
            titleVisibility: .visible
        ) {
            Button(i18n.t("common.delete"), role: .destructive) {
                if let code = pendingDelete?.code { Task { await catalog.deleteRole(code) } }
                pendingDelete = nil
            }
            Button(i18n.t("common.cancel"), role: .cancel) { pendingDelete = nil }
        }
    }
}

/// One role row: code (mono), name, type badge, permission count.
private struct RoleRow: View {
    @Environment(I18n.self) private var i18n
    let role: RoleView

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(role.code).font(.mono(13, weight: .bold))
                Spacer()
                StatusBadge(
                    role.isSystem ? i18n.t("users.systemRole") : i18n.t("users.customRole"),
                    color: role.isSystem ? Tokens.slate : Tokens.signalBlue)
            }
            Text(role.name).font(.body.weight(.semibold))
            if let description = role.description, !description.isEmpty {
                Text(description).font(.caption).foregroundStyle(.secondary)
            }
            Text(i18n.t("users.permissionsCount") + ": \(role.permissionCodes.count)")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
    }
}
