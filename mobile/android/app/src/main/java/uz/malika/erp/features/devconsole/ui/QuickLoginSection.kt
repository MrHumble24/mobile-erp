package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Developer Console section: one-tap sign-in fillers for the seeded local-dev
 * accounts. Tapping a preset hands its credentials to [DevQuickLogin]; the
 * sign-in screen fills its fields when it reappears. English-only (dev tooling);
 * gated with the rest of the console by [uz.malika.erp.features.devconsole.DevAccess].
 */
@Composable
fun QuickLoginSection(@Suppress("UNUSED_PARAMETER") container: AppContainer) {
    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            "Tap an account to prefill the sign-in form. Credentials are local test seed data.",
            style = MaterialTheme.typography.bodySmall,
            color = Tokens.mutedForeground,
        )
        devAccounts.forEach { account ->
            val (fg, bg) = roleBadgeColors(account.id)
            AppCard(Modifier.fillMaxWidth(), onClick = { DevQuickLogin.request(account) }) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Icon(account.icon, contentDescription = null, tint = fg)
                    Spacer(Modifier.width(10.dp))
                    Column(Modifier.weight(1f)) {
                        Text(account.label, style = MaterialTheme.typography.titleMedium)
                        Text(account.roleName, style = MaterialTheme.typography.bodySmall, color = Tokens.mutedForeground)
                    }
                    RoleBadge(account.id.uppercase(), fg, bg)
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    account.email,
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = MonoFamily),
                    color = Tokens.foreground,
                )
            }
        }
    }
}

/**
 * Role pill: solid [fg] label on a flat [bg] tint. Unlike the shared `StatusChip`
 * (one colour, 12%-alpha fill) this takes an explicit background token so the Ink
 * role mapping (accent/surface2, success/successBg, info/infoBg) reads exactly.
 */
@Composable
private fun RoleBadge(text: String, fg: Color, bg: Color) {
    Box(
        Modifier
            .background(bg, RoundedCornerShape(Tokens.radiusFull))
            .padding(horizontal = Tokens.Space.chipH, vertical = Tokens.Space.chipV),
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge, color = fg)
    }
}
