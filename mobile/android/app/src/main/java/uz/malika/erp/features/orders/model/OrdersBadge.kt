package uz.malika.erp.features.orders.model

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.orders.data.OrdersRepository

/**
 * Process-wide count of NEW orders for the More tab badge. A singleton because
 * the [uz.malika.erp.app.NavItem] that shows it is a static declaration, so the
 * badge needs a live flow reachable without a container. Refreshed when the More
 * tab opens and after a status change. Online only: a failed fetch keeps the last
 * value, nothing is persisted.
 */
object OrdersBadge {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    fun refresh(scope: CoroutineScope, repo: OrdersRepository) {
        scope.launch {
            runCatching { repo.stats() }.onSuccess { _count.value = it.new }
        }
    }
}
