package uz.malika.erp.features.devconsole.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AdminPanelSettings
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import uz.malika.erp.ui.theme.Tokens

/** A seeded local-dev login preset (Malika Bazaar test database). */
data class DevAccount(
    val id: String,
    val label: String,
    val roleName: String,
    val email: String,
    val password: String,
    val icon: ImageVector,
)

/**
 * Role badge/icon colours (foreground, background tint) as adaptive Ink tokens.
 * Resolved in composition because `Tokens.*` are `@Composable` getters that pick
 * the light/dark value — so they cannot be baked into the top-level [devAccounts].
 */
@Composable
fun roleBadgeColors(id: String): Pair<Color, Color> = when (id) {
    "cashier" -> Tokens.success to Tokens.successBg
    "qc" -> Tokens.info to Tokens.infoBg
    else -> Tokens.primary to Tokens.surface2 // owner (ink on muted; accent aliases surface2)
}

/** Pre-configured dev/test credentials, ported from the iOS `DevAccounts.all`. */
val devAccounts: List<DevAccount> = listOf(
    DevAccount(
        id = "owner",
        label = "Owner (Admin)",
        roleName = "Store Owner / Full Admin",
        email = "owner@malika.uz",
        password = "Mb-n2yyUZbS6gX0FJL9",
        icon = Icons.Outlined.AdminPanelSettings,
    ),
    DevAccount(
        id = "cashier",
        label = "Cashier",
        roleName = "POS Counter & Consignments",
        email = "cashier@malika.uz",
        password = "Mb-cBbRZWbdB7bm9pGu",
        icon = Icons.Outlined.ShoppingCart,
    ),
    DevAccount(
        id = "qc",
        label = "QC Specialist",
        roleName = "Device Inspection & Grading",
        email = "qc@malika.uz",
        password = "Mb-dug8wKXNx8PfEpK2",
        icon = Icons.Outlined.VerifiedUser,
    ),
)

/**
 * One-shot carrier for a quick-login preset tapped in the Developer Console. The
 * sign-in screen (which lives below the console in the same back stack) reads
 * [pending] when it next composes, fills its email/password, then [consume]s it.
 * Process-scoped only — no persistence, dev tooling behind [DevAccess].
 */
object DevQuickLogin {
    private val _pending = MutableStateFlow<DevAccount?>(null)
    val pending: StateFlow<DevAccount?> = _pending

    fun request(account: DevAccount) { _pending.value = account }
    fun consume() { _pending.value = null }
}
