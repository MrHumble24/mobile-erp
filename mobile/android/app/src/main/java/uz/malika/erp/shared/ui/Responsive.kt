package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.Dp
import uz.malika.erp.ui.theme.Tokens

/**
 * Compact-width window (phones, < 600 dp) — the same breakpoint the nav chrome
 * switches on (`WIDE_BREAKPOINT` in app/AppShell). On compact, nothing lays
 * content side by side in columns: tiles, tables and paired inputs stack as
 * full-width rows. Wide windows (≥ 600 dp, the rail layout) keep columns.
 */
const val COMPACT_WIDTH_DP = 600

@Composable
@ReadOnlyComposable
fun isCompactWidth(): Boolean =
    LocalConfiguration.current.screenWidthDp < COMPACT_WIDTH_DP

/**
 * Lays [fields] side by side (each `Modifier.weight(1f)`) on wide windows and
 * stacks them full-width on compact, so two inputs never share a cramped phone
 * row (min/max amount, cost/price, label/key, …). Each entry renders itself
 * with the modifier it is handed.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AdaptiveInputs(
    fields: List<@Composable (Modifier) -> Unit>,
    modifier: Modifier = Modifier,
    spacing: Dp = Tokens.Space.section,
) {
    if (isCompactWidth()) {
        Column(modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(spacing)) {
            fields.forEach { it(Modifier.fillMaxWidth()) }
        }
    } else {
        Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(spacing)) {
            fields.forEach { it(Modifier.weight(1f)) }
        }
    }
}
