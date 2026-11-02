package uz.malika.erp.features.devconsole

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import uz.malika.erp.BuildConfig

/**
 * Gates visibility of the Developer Console. In debug builds it is always
 * reachable; in release builds it stays hidden until the access code is entered
 * this session (process lifetime — no persistence). The code is a convenience
 * gate, not a security boundary; anything sensitive stays server-side.
 */
object DevAccess {

    const val CODE = "153535"

    private val _unlocked = MutableStateFlow(BuildConfig.DEBUG)

    /** True once the console may be shown (debug: always; release: after the code). */
    val unlocked: StateFlow<Boolean> = _unlocked

    /** Returns true and unlocks if [code] matches; false otherwise. */
    fun unlock(code: String): Boolean {
        if (code.trim() != CODE) return false
        _unlocked.value = true
        return true
    }
}
