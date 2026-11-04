import SwiftUI

/// Users tab: the summary list-card (total / active / inactive), the system
/// search bar, filter + new user in the toolbar, then one card per user
/// (name, mono email, role pills, status pill). Rows open the detail sheet.
struct UsersListView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    let catalog: UsersCatalog
    @State private var model = UsersListModel()
    @State private var createOpen = false
    @State private var filterOpen = false
    @State private var detailUser: UserView?

    private var currentUserId: String? { container.session.user?.id }
    private var hasActiveFilters: Bool { !model.roleFilter.isEmpty || !model.activeFilter.isEmpty }

    var body: some View {
        @Bindable var model = model
        ScrollView {
            VStack(spacing: Tokens.Space.lg) {
                if let s = model.stats {
                    MetricList(rows: [
                        MetricRow(label: i18n.t("users.statTotal"), value: "\(s.total)"),
                        MetricRow(label: i18n.t("users.statActive"), value: "\(s.active)"),
                        MetricRow(label: i18n.t("users.statInactive"), value: "\(max(0, s.total - s.active))"),
                    ])
                }
                list
                if let err = model.actionError { FormErrorLine(message: err) }
            }
            .padding(.horizontal, Tokens.Space.gutter)
            .padding(.bottom, Tokens.Space.lg)
        }
        .searchable(text: $model.search, prompt: i18n.t("users.filterSearch"))
        .onSubmit(of: .search) { model.onFilterChange() }
        .onChange(of: model.search) { model.onFilterChange() }
        .refreshable { await model.load() }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { Haptic.tick.play(); filterOpen = true } label: {
                    Label(i18n.t("common.filter"),
                          systemImage: hasActiveFilters ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                }
            }
            ToolbarItem(placement: .primaryAction) {
                Button { createOpen = true } label: { Label(i18n.t("users.newUser"), systemImage: "person.badge.plus") }
            }
        }
        .task {
            model.bind(container)
            if !model.started { await model.load() }
        }
        .sheet(isPresented: $filterOpen) { UsersFilterSheet(model: model, catalog: catalog) }
        .sheet(isPresented: $createOpen) { CreateUserSheet(catalog: catalog) { Task { await model.load() } } }
        .sheet(item: $detailUser) { user in
            UserDetailSheet(userId: user.id, isSelf: user.id == currentUserId, catalog: catalog) { Task { await model.load() } }
        }
        #if DEBUG
        // Screenshot helper: `-openUser first` opens the first row's detail.
        .onChange(of: model.pager.items.count) { _, count in
            guard count > 0, detailUser == nil, KitDebugLaunch.consume("openUser") == "first" else { return }
            detailUser = model.pager.items.first
        }
        #endif
    }

    @ViewBuilder private var list: some View {
        if model.pager.isLoading && model.pager.items.isEmpty {
            AppCard { LoadingView().frame(height: 120) }
        } else if let error = model.pager.error, model.pager.items.isEmpty {
            AppCard { ErrorStateView(message: error) { Task { await model.load() } } }
        } else if model.pager.items.isEmpty {
            AppCard { EmptyStateView(systemImage: "person.slash", title: i18n.t("common.notFound")) }
        } else {
            ForEach(model.pager.items) { user in
                UserRowView(user: user) { detailUser = user }
            }
            KitLoadMoreFooter(pager: model.pager)
        }
    }
}

/// One user card: name, mono email, role pills left; status pill right.
private struct UserRowView: View {
    @Environment(I18n.self) private var i18n
    let user: UserView
    var onOpen: () -> Void

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(user.displayName).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
                    Text(user.email).font(.data(.regular)).foregroundStyle(Tokens.muted)
                    if !user.roles.isEmpty {
                        HStack(spacing: Tokens.Space.xs) {
                            ForEach(user.roles.prefix(3), id: \.self) { StatusBadge($0, color: Tokens.sold) }
                        }
                        .padding(.top, Tokens.Space.xs)
                    }
                }
                Spacer(minLength: Tokens.Space.sm)
                StatusBadge(i18n.t(user.isActive ? "users.statusActive" : "users.statusInactive"),
                            color: user.isActive ? Tokens.success : Tokens.danger)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onOpen)
    }
}
