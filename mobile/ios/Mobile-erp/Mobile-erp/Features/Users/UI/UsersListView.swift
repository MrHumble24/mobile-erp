import SwiftUI

/// Users tab: summary stats, search / role / status filters, the paginated
/// list, a "new user" action and a per-user detail sheet. Reads are gated by
/// `user.manage` (the whole screen); the active toggle is online-only.
struct UsersListView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    let catalog: UsersCatalog

    @State private var model = UsersListModel()
    @State private var createOpen = false
    @State private var detailUser: UserView?

    private var currentUserId: String? { container.session.user?.id }

    var body: some View {
        List {
            summarySection
            filterSection
            listSection
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { createOpen = true } label: { Image(systemName: "plus") }
            }
        }
        .task {
            model.bind(container)
            if !model.started { await model.load() }
        }
        .sheet(isPresented: $createOpen) {
            CreateUserSheet(catalog: catalog) { Task { await model.load() } }
        }
        .sheet(item: $detailUser) { user in
            UserDetailSheet(
                userId: user.id,
                isSelf: user.id == currentUserId,
                catalog: catalog
            ) { Task { await model.load() } }
        }
    }

    @ViewBuilder private var summarySection: some View {
        if let stats = model.stats {
            Section {
                HStack {
                    stat(i18n.t("users.statTotal"), "\(stats.total)")
                    Divider()
                    stat(i18n.t("users.statActive"), "\(stats.active)")
                    Divider()
                    stat(i18n.t("users.statInactive"), "\(stats.total - stats.active)")
                }
            }
        }
    }

    private func stat(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(Tokens.ink)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var filterSection: some View {
        Section {
            TextField(i18n.t("users.filterSearch"), text: $model.search)
                .onChange(of: model.search) { model.onFilterChange() }
            Picker(i18n.t("users.filterRole"), selection: $model.roleFilter) {
                Text(i18n.t("common.all")).tag("")
                ForEach(catalog.roles) { Text($0.name).tag($0.code) }
            }
            .onChange(of: model.roleFilter) { model.onFilterChange() }
            Picker(i18n.t("users.filterStatus"), selection: $model.activeFilter) {
                Text(i18n.t("common.all")).tag("")
                Text(i18n.t("users.statusActive")).tag("active")
                Text(i18n.t("users.statusInactive")).tag("inactive")
            }
            .onChange(of: model.activeFilter) { model.onFilterChange() }
            Button(i18n.t("users.resetFilters")) { model.resetFilters() }
        }
    }

    @ViewBuilder private var listSection: some View {
        Section {
            if model.pager.isLoading && model.pager.items.isEmpty {
                LoadingView()
            } else if let error = model.pager.error, model.pager.items.isEmpty {
                ErrorStateView(message: error) { Task { await model.load() } }
            } else if model.pager.items.isEmpty {
                EmptyStateView(systemImage: "person.slash", title: i18n.t("common.notFound"))
            } else {
                ForEach(model.pager.items) { user in
                    Button { detailUser = user } label: {
                        UserRowView(user: user)
                    }
                    .buttonStyle(.plain)
                }
                KitLoadMoreFooter(pager: model.pager)
            }
            if let err = model.actionError {
                Label(err, systemImage: "exclamationmark.triangle")
                    .font(.footnote).foregroundStyle(Tokens.danger)
            }
        }
    }
}

/// One user row: name, email (mono), role chips and an active badge.
private struct UserRowView: View {
    @Environment(I18n.self) private var i18n
    let user: UserView

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(user.displayName).font(.body.weight(.semibold))
                Spacer()
                StatusBadge(
                    user.isActive ? i18n.t("users.statusActive") : i18n.t("users.statusInactive"),
                    color: user.isActive ? Tokens.success : Tokens.ash)
            }
            Text(user.email).font(.mono(13)).foregroundStyle(.secondary)
            if !user.roles.isEmpty {
                Text(user.roles.joined(separator: " · "))
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
    }
}
