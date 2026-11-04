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
        }
        .searchable(text: $model.search, prompt: i18n.t("users.filterSearch", default: "Search name, phone, or email"))
        .onSubmit(of: .search) { model.onFilterChange() }
        .onChange(of: model.search) { model.onFilterChange() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Haptic.tick.play()
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
            if !model.started { await model.load() }
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
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(user.displayName)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Tokens.ink)
                    Text(user.email)
                        .font(.mono(13))
                        .foregroundStyle(Tokens.muted)
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
                            .background(Tokens.surface2, in: RoundedRectangle(cornerRadius: 4))
                            .foregroundStyle(Tokens.muted)
                    }
                }
                .padding(.top, 2)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}
