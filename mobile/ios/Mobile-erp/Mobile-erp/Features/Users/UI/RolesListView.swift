import SwiftUI

/// Roles tab: one card per role (name, mono code, description, permission
/// count; system/custom pill). Tapping opens the edit sheet, which also holds
/// delete for custom roles. Permission editing lives in the matrix tab. All
/// writes need `role.manage` and are online-only.
struct RolesListView: View {
    @Environment(I18n.self) private var i18n
    @Bindable var catalog: UsersCatalog
    @State private var createOpen = false
    @State private var editing: RoleView?

    var body: some View {
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let err = catalog.actionError { FormErrorLine(message: err) }
                ForEach(catalog.roles) { role in RoleCard(role: role) { editing = role } }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { createOpen = true } label: { Label(i18n.t("users.newRole"), systemImage: "plus") }
            }
        }
        .sheet(isPresented: $createOpen) { CreateRoleSheet(catalog: catalog) }
        .sheet(item: $editing) { role in EditRoleSheet(catalog: catalog, role: role) }
    }
}

private struct RoleCard: View {
    @Environment(I18n.self) private var i18n
    let role: RoleView
    var onOpen: () -> Void

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(role.name).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    Text(role.code).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    if let d = role.description, !d.isEmpty {
                        Text(d).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    Text("\(i18n.t("users.permissionsCount")): \(role.permissionCodes.count)")
                        .font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                Spacer(minLength: Tokens.Space.sm)
                StatusBadge(i18n.t(role.isSystem ? "users.systemRole" : "users.customRole"),
                            color: role.isSystem ? Tokens.sold : Tokens.info)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onOpen)
    }
}
