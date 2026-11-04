package uz.malika.erp.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * Detail-sheet building blocks (DESIGN.md): keyed fact rows separated by
 * hairlines, and the surface-2 subject block that heads a write sheet. Never a
 * card nested in a sheet.
 */

/** Keyed fact row: muted label left, value right, hairline below unless [last]. */
@Composable
fun FactRow(label: String, last: Boolean = false, value: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 44.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = Tokens.muted, modifier = Modifier.weight(1f))
        Spacer(Modifier.width(Tokens.Space.md))
        value()
    }
    if (!last) HorizontalDivider(color = Tokens.border)
}

/** The subject of a write sheet (title + a mono or plain line, optional trailing slot). */
@Composable
fun SubjectBlock(title: String, line: String, mono: Boolean = true, trailing: (@Composable () -> Unit)? = null) {
    Row(
        Modifier.fillMaxWidth()
            .background(Tokens.surface2, RoundedCornerShape(Tokens.Radius.controls))
            .padding(Tokens.Space.lg),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall, color = Tokens.text)
            val base = MaterialTheme.typography.bodyMedium
            Text(line, style = if (mono) base.copy(fontFamily = MonoFamily) else base, color = Tokens.text)
        }
        trailing?.invoke()
    }
}
