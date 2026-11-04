package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import uz.malika.erp.ui.theme.Tokens

/**
 * "You are offline" strip: a surface-2 strip, cloud-off glyph and [message].
 * Shown at the top of any screen or sheet whose writes are online-only (login,
 * device intake). Pure presentation — the caller decides when `!online` and
 * passes the localized copy.
 */
@Composable
fun OfflineBanner(message: String, modifier: Modifier = Modifier) {
    Row(
        modifier
            .fillMaxWidth()
            .background(Tokens.surface2, RoundedCornerShape(Tokens.Radius.controls))
            .padding(Tokens.Space.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Outlined.CloudOff, contentDescription = null, tint = Tokens.muted)
        Spacer(Modifier.width(Tokens.Space.gap))
        Text(message, style = MaterialTheme.typography.bodySmall)
    }
}
