package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.PaddingValues
import uz.malika.erp.ui.theme.Tokens

/**
 * Bottom inset for a scrolling list so its last row is not hidden under a FAB
 * (`fab = true`) or flush against the bottom bar (`fab = false`). Bottom-only on
 * purpose: callers keep their own horizontal gutter, so this never double-pads.
 */
fun listBottomPadding(fab: Boolean = false): PaddingValues =
    PaddingValues(bottom = if (fab) Tokens.Space.fabClearance else Tokens.Space.listBottom)
