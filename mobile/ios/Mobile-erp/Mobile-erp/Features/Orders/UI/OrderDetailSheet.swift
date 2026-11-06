import SwiftUI

/// One storefront order in full (handoff 029): header with a dialable phone,
/// the customer note, who handled it, the status actions the server rules allow
/// (`order.manage`), and the status history. A refusal shows the server message;
/// a 404 (gone or another store) closes the sheet. Online only.
struct OrderDetailSheet: View {
    let orderId: String
    let onChanged: () -> Void
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.dismiss) private var dismiss

    @State private var order: StorefrontOrderDetail?
    @State private var error: String?
    @State private var busy = false
    @State private var pending: OrderStatusAction?

    private var canManage: Bool { container.session.can("order.manage") }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Tokens.Space.gutter) {
                SheetTitleRow(title: i18n.t("orders.details", default: "Order details")) { dismiss() }
                if let order { detail(order) }
                else if let error { ErrorStateView(message: error) { load() } }
                else { LoadingView().frame(height: 200) }
            }
            .padding(Tokens.Space.gutter)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .scrollBounceBehavior(.basedOnSize)
        .background(Tokens.card)
        .confirmationDialog(
            pending.map { i18n.t(OrderStatusStyle.actionConfirmKey($0)) } ?? "",
            isPresented: Binding(get: { pending != nil }, set: { if !$0 { pending = nil } }),
            titleVisibility: .visible,
            presenting: pending
        ) { action in
            Button(i18n.t(OrderStatusStyle.actionLabelKey(action)), role: action == .cancel ? .destructive : nil) {
                apply(action)
            }
            Button(i18n.t("common.back"), role: .cancel) {} // not "cancel": the action itself is "Cancel order"
        }
        .task { if order == nil { load() } }
    }

    private func detail(_ o: StorefrontOrderDetail) -> some View {
        VStack(alignment: .leading, spacing: Tokens.Space.gutter) {
            OrderHeaderBlock(order: o)
            if let note = o.note, !note.isEmpty { labelled("orders.note", note) }
            if let handler = o.handledByName {
                labelled("orders.handledBy", handler + (o.handledAt.map { " · \(KitDate.dayTime($0))" } ?? ""))
            }
            if canManage {
                let actions = OrderRules.allowedActions(status: o.statusCode, canManage: true)
                if !actions.isEmpty { actionButtons(actions) }
            }
            OrderHistorySection(history: o.history)
            if let error { FormErrorLine(message: error) }
        }
    }

    private func actionButtons(_ actions: [OrderStatusAction]) -> some View {
        VStack(spacing: Tokens.Space.sm) {
            ForEach(actions, id: \.self) { action in
                Button { pending = action } label: {
                    Text(i18n.t(OrderStatusStyle.actionLabelKey(action))).frame(maxWidth: .infinity)
                }
                .buttonStyle(action == .cancel ? .pillDestructive : .pillPrimary)
                .disabled(busy)
            }
        }
    }

    private func labelled(_ key: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(i18n.t(key)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Text(value).font(.ui(.body)).foregroundStyle(Tokens.text)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func load() {
        error = nil
        Task {
            do { order = try await OrdersRepository(container).get(orderId) }
            catch let e as AppError { handle(e) }
            catch { self.error = error.localizedDescription }
        }
    }

    private func apply(_ action: OrderStatusAction) {
        guard !busy else { return }
        busy = true
        error = nil
        Task {
            defer { busy = false }
            do {
                order = try await OrdersRepository(container).updateStatus(orderId, to: OrderRules.targetStatus(action))
                container.toasts.success(i18n.t("orders.statusUpdated", default: "Order status updated"))
                onChanged()
            } catch let e as AppError { handle(e) }
            catch { self.error = error.localizedDescription }
        }
    }

    /// A 404 means the order moved to another store or is gone: tell the user and
    /// close. Any other refusal shows its server message inline.
    private func handle(_ e: AppError) {
        if e.statusCode == 404 {
            container.toasts.error(i18n.t("orders.notFoundMessage", default: "Order not found or belongs to another store"))
            onChanged()
            dismiss()
        } else {
            error = e.message
        }
    }
}

/// Header: customer, status, dialable + copyable phone, product, variant, store,
/// arrival time.
private struct OrderHeaderBlock: View {
    let order: StorefrontOrderDetail
    @Environment(AppContainer.self) private var container
    @Environment(I18n.self) private var i18n
    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(order.customerName).font(.ui(.title)).foregroundStyle(Tokens.text)
            StatusBadge(OrderStatusStyle.label(order.statusCode, i18n), color: OrderStatusStyle.color(order.statusCode))
            Button {
                if let url = URL(string: "tel:\(order.customerPhone)") { openURL(url) }
            } label: {
                Text(order.customerPhone).font(.mono(16, weight: .semibold)).foregroundStyle(Tokens.info)
            }
            .buttonStyle(.plain)
            .contextMenu {
                Button {
                    UIPasteboard.general.string = order.customerPhone
                    container.toasts.info(i18n.t("orders.phoneCopied", default: "Phone number copied"))
                } label: { Label(i18n.t("common.copy", default: "Copy"), systemImage: "doc.on.doc") }
            }
            Text(order.productLine).font(.ui(.body)).foregroundStyle(Tokens.text)
            if let spec = order.specLine { Text(spec).font(.ui(.caption)).foregroundStyle(Tokens.muted) }
            Text(order.storeName).font(.ui(.caption)).foregroundStyle(Tokens.muted)
            Text(KitDate.dayTime(order.createdAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The status history list: each move as a chip + when, who, and the note.
private struct OrderHistorySection: View {
    let history: [StorefrontOrderHistoryItem]
    @Environment(I18n.self) private var i18n

    var body: some View {
        VStack(alignment: .leading, spacing: Tokens.Space.sm) {
            Text(i18n.t("orders.history", default: "Status history")).font(.ui(.bodyStrong)).foregroundStyle(Tokens.text)
            ForEach(history) { h in
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        StatusBadge(h.toStatusLabel, color: OrderStatusStyle.color(h.toStatusCode))
                        Spacer(minLength: Tokens.Space.sm)
                        Text(KitDate.dayTime(h.changedAt)).font(.ui(.caption)).foregroundStyle(Tokens.muted)
                    }
                    if let who = h.changedByName { Text(who).font(.ui(.caption)).foregroundStyle(Tokens.muted) }
                    if let note = h.note, !note.isEmpty { Text(note).font(.ui(.caption)).foregroundStyle(Tokens.text) }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
