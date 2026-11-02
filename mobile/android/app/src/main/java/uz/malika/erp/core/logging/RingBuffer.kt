package uz.malika.erp.core.logging

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * A bounded, append-only buffer exposed as a [StateFlow] so screens update live.
 * Holds at most [capacity] items in insertion order (oldest first); once full,
 * adding one drops the oldest. Pure JVM logic — unit-tested for cap + order.
 */
class RingBuffer<T>(private val capacity: Int) {

    private val _items = MutableStateFlow<List<T>>(emptyList())
    val items: StateFlow<List<T>> = _items

    @Synchronized
    fun add(item: T) {
        val next = _items.value + item
        _items.value = if (next.size > capacity) next.takeLast(capacity) else next
    }

    @Synchronized
    fun clear() {
        _items.value = emptyList()
    }
}
