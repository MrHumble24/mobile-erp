package uz.malika.erp.core

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

/**
 * Cross-layer channel for store refusals:
 * - `STORE_REQUIRED`: any call got 400 with `STORE_REQUIRED` (need to choose store)
 * - `STORE_FORBIDDEN`: any call got 403 with `STORE_FORBIDDEN` (active store revoked)
 */
class StoreEvents {
    private val _storeRequired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val storeRequired: SharedFlow<Unit> = _storeRequired

    private val _storeForbidden = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val storeForbidden: SharedFlow<Unit> = _storeForbidden

    fun signalStoreRequired() {
        _storeRequired.tryEmit(Unit)
    }

    fun signalStoreForbidden() {
        _storeForbidden.tryEmit(Unit)
    }
}
