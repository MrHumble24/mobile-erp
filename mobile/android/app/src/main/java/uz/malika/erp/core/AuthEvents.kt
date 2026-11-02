package uz.malika.erp.core

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

/**
 * Cross-layer channel for "the server rejected our token" (401 on a non-login
 * request). The HTTP client owns the interceptor but must not depend on the
 * auth feature; it bumps [unauthorized] instead. The session observer listens
 * and clears the session, bouncing the app to login.
 */
class AuthEvents {
    private val _unauthorized = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val unauthorized: SharedFlow<Unit> = _unauthorized

    fun signalUnauthorized() {
        _unauthorized.tryEmit(Unit)
    }
}
