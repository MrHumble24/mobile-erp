package uz.malika.erp.data.sync

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.stateIn
import uz.malika.erp.core.logging.AppLog

/**
 * `true` when the device has a validated internet transport. Drives the sync
 * manager (auto-sync on regain) and the offline banner. Feature screens that
 * gate online-only writes read [online].
 */
class Connectivity(context: Context, scope: CoroutineScope) {

    private val cm = context.getSystemService(ConnectivityManager::class.java)

    val online: StateFlow<Boolean> = callbackFlow {
        val networks = mutableSetOf<Network>()
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                networks += network
                trySend(true)
            }

            override fun onLost(network: Network) {
                networks -= network
                trySend(networks.isNotEmpty())
            }
        }
        trySend(isCurrentlyOnline())
        cm?.registerDefaultNetworkCallback(callback)
        awaitClose { cm?.unregisterNetworkCallback(callback) }
    }.distinctUntilChanged()
        .onEach { AppLog.i("net", if (it) "online" else "offline") }
        .stateIn(scope, SharingStarted.Eagerly, isCurrentlyOnline())

    private fun isCurrentlyOnline(): Boolean {
        val active = cm?.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(active) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
