import SwiftUI

/// Online storefront orders (handoff 029, ADR 0049/0050): status chips, a
/// newest-first list paged on scroll, pull-to-refresh; tap a row for the detail
/// and the status actions. Online only; `order.read` gates the whole screen.
struct OrdersView: View {
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @State private var model = OrdersListModel()
    @State private var tab = ""
    @State private var selected: StorefrontOrderListItem?

    private var chips: [TabChipItem<String>] {
        ([nil] + OrderRules.statuses).map { code in
            TabChipItem(value: code ?? "", label: i18n.t(OrderStatusStyle.labelKey(code)))
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            TabChips(selection: $tab, items: chips)
                .padding(.vertical, Tokens.Space.md)
                .onChange(of: tab) { _, t in model.status = t.isEmpty ? nil : t; model.reload() }
            content
        }
        .background(Tokens.ground)
        .navigationTitle(i18n.t("orders.title", default: "Online Orders"))
        .appSheet(item: $selected) { item in
            OrderDetailSheet(orderId: item.id) {
                model.reload()
                OrdersBadge.shared.refresh(container)
            }
        }
        .task {
            model.configure(container)
            #if DEBUG
            _ = OrderRulesSelfCheck.ran
            #endif
            OrdersBadge.shared.refresh(container)
            if model.items.isEmpty { model.reload() }
        }
        .refreshable { model.reload() }
    }

    @ViewBuilder private var content: some View {
        if model.offline {
            EmptyStateView(systemImage: "wifi.slash", title: i18n.t("common.offline"),
                           message: i18n.t("orders.offlineNotice", default: "Online only. Connect to the internet to manage orders."))
        } else if model.loading && model.items.isEmpty {
            LoadingView()
        } else if let error = model.error, model.items.isEmpty {
            ErrorStateView(message: error) { model.reload() }
        } else if model.items.isEmpty {
            EmptyStateView(systemImage: "bag", title: i18n.t("orders.noOrders", default: "No orders found"))
        } else {
            ScrollView {
                VStack(spacing: Tokens.Space.md) {
                    ForEach(model.items) { order in
                        Button { selected = order } label: { OrderRow(order: order) }
                            .buttonStyle(.plain)
                            .onAppear { if order.id == model.items.last?.id { model.loadMore() } }
                    }
                    if model.loadingMore { ProgressView().tint(Tokens.muted).padding(.vertical, Tokens.Space.sm) }
                }
                .padding(.horizontal, Tokens.Space.gutter)
                .padding(.vertical, Tokens.Space.md)
            }
        }
    }
}

/// One order row: customer + mono phone, product + variant, how long ago, status.
private struct OrderRow: View {
    let order: StorefrontOrderListItem
    @Environment(I18n.self) private var i18n

    var body: some View {
        AppCard {
            HStack(alignment: .top, spacing: Tokens.Space.sm) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(order.customerName).font(.ui(.body)).foregroundStyle(Tokens.text)
                    Text(order.customerPhone).font(.mono(13, weight: .medium)).foregroundStyle(Tokens.muted)
                    Text(order.productLine).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    if let spec = order.specLine {
                        Text(spec).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    Text(OrderTimeAgo.text(iso: order.createdAt, i18n)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                }
                Spacer(minLength: Tokens.Space.sm)
                StatusBadge(OrderStatusStyle.label(order.statusCode, i18n), color: OrderStatusStyle.color(order.statusCode))
            }
        }
    }
}
