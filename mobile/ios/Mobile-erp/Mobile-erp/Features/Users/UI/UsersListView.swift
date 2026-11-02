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
            if model.hasPrev || model.hasNext { pagerSection }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { createOpen = true } label: { Image(systemName: "plus") }
            }
        }
        .task {
            model.bind(container)
            if model.data == nil { await model.load() }
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
            if model.loading && model.data == nil {
                LoadingView()
            } else if let error = model.loadError {
                ErrorStateView(message: error.message) { Task { await model.load() } }
            } else if let items = model.data?.items, !items.isEmpty {
                ForEach(items) { user in
                    Button { detailUser = user } label: {
                        UserRowView(user: user)
                    }
                    .buttonStyle(.plain)
                }
            } else {
                EmptyStateView(systemImage: "person.slash", title: i18n.t("common.notFound"))
            }
            if let err = model.actionError {
                Label(err, systemImage: "exclamationmark.triangle")
                    .font(.footnote).foregroundStyle(Tokens.danger)
            }
        }
    }

    private var pagerSection: some View {
        Section {
            HStack {
                Button(i18n.t("common.back")) { model.setPage(model.page - 1) }
                    .disabled(!model.hasPrev)
                Spacer()
                Text(i18n.t("users.rangeLabel", [
                    "from": "\((model.page - 1) * UsersListModel.pageSize + 1)",
                    "to": "\(min(model.page * UsersListModel.pageSize, model.total))",
                    "total": "\(model.total)",
                ], default: "\(model.page)"))
                    .font(.footnote).foregroundStyle(.secondary)
                Spacer()
                Button(i18n.t("common.submit", default: "Next")) { model.setPage(model.page + 1) }
                    .disabled(!model.hasNext)
            }
            .buttonStyle(.bordered)
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
