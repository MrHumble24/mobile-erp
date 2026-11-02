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
    @State private var filterOpen = false
    @State private var detailUser: UserView?

    private var currentUserId: String? { container.session.user?.id }

    private var hasActiveFilters: Bool {
        !model.roleFilter.isEmpty || !model.activeFilter.isEmpty
    }

    var body: some View {
        List {
            listSection
            if model.hasPrev || model.hasNext { pagerSection }
        }
        .searchable(text: $model.search, prompt: i18n.t("users.filterSearch", default: "Search name, phone, or email"))
        .onSubmit(of: .search) { model.onFilterChange() }
        .onChange(of: model.search) { model.onFilterChange() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    filterOpen = true
                } label: {
                    Label(
                        i18n.t("common.filter", default: "Filters"),
                        systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle"
                    )
                }
            }
            ToolbarItem(placement: .primaryAction) {
                Button {
                    createOpen = true
                } label: {
                    Label(i18n.t("users.newUser"), systemImage: "plus")
                }
            }
        }
        .task {
            model.bind(container)
            if model.data == nil { await model.load() }
        }
        .sheet(isPresented: $filterOpen) {
            UsersFilterSheet(model: model, catalog: catalog)
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
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(user.displayName)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Tokens.ink)
                    Text(user.email)
                        .font(.mono(13))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                StatusBadge(
                    user.isActive ? i18n.t("users.statusActive") : i18n.t("users.statusInactive"),
                    color: user.isActive ? Tokens.success : Tokens.ash)
            }
            if !user.roles.isEmpty {
                HStack(spacing: 6) {
                    ForEach(user.roles, id: \.self) { role in
                        Text(role)
                            .font(.system(size: 11, weight: .medium))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 4))
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.top, 2)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}
