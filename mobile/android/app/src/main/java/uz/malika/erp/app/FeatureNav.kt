package uz.malika.erp.app

import java.util.concurrent.ConcurrentHashMap
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

/**
 * Cross-feature navigation — the one way a slice opens a screen another slice
 * owns, callable from any screen or ViewModel (it lives on `AppContainer`, not
 * the Compose tree). It extends the existing route system: destinations carry a
 * [FeatureRegistry] route string plus one optional preload arg (an imei / id).
 *
 * The app shell collects [destinations] and performs the actual `nav.navigate`
 * (see `AppNavHost`). The target screen reads its preload once with
 * [consumeArg] — typically in a `LaunchedEffect` that seeds its ViewModel.
 */
class FeatureNav {
    private val _destinations = MutableSharedFlow<Destination>(extraBufferCapacity = 8)
    val destinations: SharedFlow<Destination> = _destinations

    // ponytail: process-memory arg handoff, cleared on consume. Survives config
    // change (container is a process singleton), NOT process death — fine for a
    // navigation preload. Move to SavedStateHandle args if that ever matters.
    private val pending = ConcurrentHashMap<String, String>()

    /** Open another feature's screen, optionally preloading an imei / id. */
    fun open(dest: Destination) {
        dest.arg?.let { pending[dest.route] = it }
        _destinations.tryEmit(dest)
    }

    /** The preload for [route] (imei / id), read-and-cleared. Null if none. */
    fun consumeArg(route: String): String? = pending.remove(route)
}

/**
 * The reachable cross-feature destinations. Each maps to a route already
 * registered in [FeatureRegistry]; the optional arg is the screen's preload.
 */
sealed class Destination(val route: String, val arg: String?) {
    /** Devices list, optionally scrolled/opened to [imei]. */
    class Inventory(imei: String? = null) : Destination("inventory", imei)

    /** POS checkout, optionally with [imei] already in the cart draft. */
    class Pos(imei: String? = null) : Destination("pos", imei)

    /** QC queue, optionally opening the grade sheet for [imei]. */
    class Qc(imei: String? = null) : Destination("qc", imei)

    /** Sales list, optionally opening the detail for [saleId]. */
    class Sales(saleId: String? = null) : Destination("sales", saleId)

    /** Consignments list, optionally opening the detail for [id]. */
    class Consignments(id: String? = null) : Destination("consignments", id)
}
