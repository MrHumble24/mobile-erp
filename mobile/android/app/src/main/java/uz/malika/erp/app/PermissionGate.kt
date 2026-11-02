package uz.malika.erp.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.ui.theme.Tokens

/** The effective permission check for the current session, provided by the shell. */
val LocalCan = staticCompositionLocalOf<(String) -> Boolean> { { false } }

/**
 * Wraps a screen that requires a permission code: renders [content] when the
 * user `can(permission)`, else an inline 403 panel. Feature route builders wrap
 * their screen in this.
 */
@Composable
fun PermissionGate(permission: String, content: @Composable () -> Unit) {
    if (LocalCan.current(permission)) content() else ForbiddenPanel()
}

@Composable
fun ForbiddenPanel() {
    val t = LocalT.current
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(Icons.Outlined.Lock, contentDescription = null, tint = Tokens.ash)
        Spacer(Modifier.height(12.dp))
        Text(
            t("common.forbidden", null),
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.bodyLarge,
        )
    }
}
