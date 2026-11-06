package uz.malika.erp.features.orders.lib

/**
 * Status actions allowed for an online storefront order (ADR 0049, 0050).
 */
enum class OrderStatusAction {
    MARK_CONTACTED,
    MARK_DONE,
    CANCEL,
}

object OrderRules {

    const val STATUS_NEW = "NEW"
    const val STATUS_CONTACTED = "CONTACTED"
    const val STATUS_DONE = "DONE"
    const val STATUS_CANCELLED = "CANCELLED"

    /**
     * Determine which status actions are allowed for a given status and user permissions.
     * Actions require `order.manage` permission. DONE and CANCELLED are final.
     */
    fun allowedActions(statusCode: String, canManage: Boolean): List<OrderStatusAction> {
        if (!canManage) return emptyList()
        return when (statusCode) {
            STATUS_NEW -> listOf(OrderStatusAction.MARK_CONTACTED, OrderStatusAction.CANCEL)
            STATUS_CONTACTED -> listOf(OrderStatusAction.MARK_DONE, OrderStatusAction.CANCEL)
            STATUS_DONE, STATUS_CANCELLED -> emptyList()
            else -> emptyList()
        }
    }

    /** Maps an action to its target server status code. */
    fun targetStatus(action: OrderStatusAction): String = when (action) {
        OrderStatusAction.MARK_CONTACTED -> STATUS_CONTACTED
        OrderStatusAction.MARK_DONE -> STATUS_DONE
        OrderStatusAction.CANCEL -> STATUS_CANCELLED
    }

    /** Whether the status is final and permits no further transitions. */
    fun isTerminal(statusCode: String): Boolean =
        statusCode == STATUS_DONE || statusCode == STATUS_CANCELLED
}
