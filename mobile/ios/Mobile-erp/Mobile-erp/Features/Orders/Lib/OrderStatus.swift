import Foundation

/// One status move the staff can trigger on an order.
enum OrderStatusAction: String, CaseIterable {
    case markContacted
    case markDone
    case cancel
}

/// The storefront-order state machine (ADR 0049, 0050), mirroring the server
/// (`storefront-orders.service.ts`): NEW → CONTACTED → DONE, and NEW/CONTACTED →
/// CANCELLED. DONE and CANCELLED are terminal. The app never decides a rule — it
/// offers the buttons the rule allows and shows the server's refusal. Pure —
/// covered by `OrderRulesSelfCheck`.
enum OrderRules {
    static let statusNew = "NEW"
    static let statusContacted = "CONTACTED"
    static let statusDone = "DONE"
    static let statusCancelled = "CANCELLED"

    static let statuses = [statusNew, statusContacted, statusDone, statusCancelled]

    /// Which actions a status + permission set allows. Needs `order.manage`;
    /// terminal statuses allow nothing.
    static func allowedActions(status: String, canManage: Bool) -> [OrderStatusAction] {
        guard canManage else { return [] }
        switch status {
        case statusNew: return [.markContacted, .cancel]
        case statusContacted: return [.markDone, .cancel]
        default: return []
        }
    }

    /// The server status an action targets.
    static func targetStatus(_ action: OrderStatusAction) -> String {
        switch action {
        case .markContacted: return statusContacted
        case .markDone: return statusDone
        case .cancel: return statusCancelled
        }
    }

    static func isTerminal(_ status: String) -> Bool {
        status == statusDone || status == statusCancelled
    }
}

#if DEBUG
/// Self-check: the allowed actions, target mapping and time-ago bucketing match
/// the server rules (handoff 029). Triggered once from `OrdersView`.
enum OrderRulesSelfCheck {
    static let ran: Void = {
        assert(OrderRules.allowedActions(status: "NEW", canManage: true) == [.markContacted, .cancel])
        assert(OrderRules.allowedActions(status: "CONTACTED", canManage: true) == [.markDone, .cancel])
        assert(OrderRules.allowedActions(status: "DONE", canManage: true).isEmpty)
        assert(OrderRules.allowedActions(status: "CANCELLED", canManage: true).isEmpty)
        assert(OrderRules.allowedActions(status: "NEW", canManage: false).isEmpty)
        assert(OrderRules.targetStatus(.markContacted) == "CONTACTED")
        assert(OrderRules.targetStatus(.markDone) == "DONE")
        assert(OrderRules.targetStatus(.cancel) == "CANCELLED")
        assert(OrderRules.isTerminal("DONE") && !OrderRules.isTerminal("NEW"))

        let now: TimeInterval = 1_000_000_000
        assert(OrderTimeAgo.bucket(createdAt: now - 30, now: now) == .justNow)
        assert(OrderTimeAgo.bucket(createdAt: now - 300, now: now) == .minutes(5))
        assert(OrderTimeAgo.bucket(createdAt: now - 3 * 3600, now: now) == .hours(3))
        assert(OrderTimeAgo.bucket(createdAt: now - 2 * 86_400, now: now) == .days(2))
        assert(OrderTimeAgo.bucket(createdAt: now + 60, now: now) == .justNow)
    }()
}
#endif
