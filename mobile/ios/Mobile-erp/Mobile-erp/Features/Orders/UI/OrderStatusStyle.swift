import SwiftUI

/// One hue and one label per order status, shared by the list chips, the rows and
/// the detail header so a status reads the same everywhere.
enum OrderStatusStyle {
    static func color(_ code: String) -> Color {
        switch code {
        case OrderRules.statusNew: Tokens.info
        case OrderRules.statusContacted: Tokens.warning
        case OrderRules.statusDone: Tokens.success
        case OrderRules.statusCancelled: Tokens.danger
        default: Tokens.muted
        }
    }

    /// i18n key for a status code, or the "All" chip when nil.
    static func labelKey(_ code: String?) -> String {
        switch code {
        case OrderRules.statusNew: "orders.statusNew"
        case OrderRules.statusContacted: "orders.statusContacted"
        case OrderRules.statusDone: "orders.statusDone"
        case OrderRules.statusCancelled: "orders.statusCancelled"
        default: "orders.statusAll"
        }
    }

    static func label(_ code: String, _ i18n: I18n) -> String {
        i18n.t(labelKey(code))
    }

    /// The i18n key + SwiftUI button style for a status action.
    static func actionLabelKey(_ action: OrderStatusAction) -> String {
        switch action {
        case .markContacted: "orders.actionMarkContacted"
        case .markDone: "orders.actionMarkDone"
        case .cancel: "orders.cancelOrder"
        }
    }

    static func actionConfirmKey(_ action: OrderStatusAction) -> String {
        switch action {
        case .markContacted: "orders.confirmContacted"
        case .markDone: "orders.confirmDone"
        case .cancel: "orders.confirmCancel"
        }
    }
}
