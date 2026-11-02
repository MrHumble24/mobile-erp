package uz.malika.erp.features.auth.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.DeveloperMode
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.auth.model.SessionViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/** Email + password sign-in, Caldera-styled. Errors surface inline. */
@Composable
fun LoginScreen(
    session: SessionViewModel,
    online: Boolean,
    onOpenDevPanel: () -> Unit,
) {
    val t = LocalT.current
    val state by session.state.collectAsState()
    val busy = state.loading
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Box(Modifier.fillMaxSize().background(Tokens.surfaceCard), contentAlignment = Alignment.Center) {
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .widthIn(max = 380.dp)
                .padding(24.dp),
            horizontalAlignment = Alignment.Start,
        ) {
            Text(t("auth.loginTitle", null), style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(4.dp))
            Text(t("auth.loginSubtitle", null), style = MaterialTheme.typography.bodyMedium)

            if (!online) {
                Spacer(Modifier.height(16.dp))
                OfflineBanner(t("auth.offlineSignIn", null))
            }

            Spacer(Modifier.height(24.dp))
            AppFormField(
                label = t("auth.emailLabel", null),
                value = email,
                onValueChange = { email = it },
                placeholder = t("auth.emailPlaceholder", null),
                enabled = !busy,
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
            )
            Spacer(Modifier.height(16.dp))
            AppFormField(
                label = t("auth.passwordLabel", null),
                value = password,
                onValueChange = { password = it },
                placeholder = t("auth.passwordPlaceholder", null),
                enabled = !busy,
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
                visualTransformation = PasswordVisualTransformation(),
            )

            state.error?.let { err ->
                Spacer(Modifier.height(12.dp))
                val message = if (err.statusCode == 401) t("auth.invalidCredentials", null) else err.message
                Text(message, style = MaterialTheme.typography.bodyMedium, color = Tokens.destructive)
            }

            Spacer(Modifier.height(24.dp))
            PillButton(
                text = if (busy) t("auth.loggingIn", null) else t("auth.loginButton", null),
                onClick = { session.login(email.trim(), password) },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Outlined.DeveloperMode, contentDescription = null, tint = Tokens.slate)
                Spacer(Modifier.height(4.dp))
                PillButton(
                    text = t("auth.devPanel", null),
                    onClick = onOpenDevPanel,
                    variant = ButtonVariant.GHOST,
                )
            }
        }
    }
}

@Composable
private fun OfflineBanner(message: String) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(Tokens.plaster, RoundedCornerShape(9.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.Outlined.CloudOff, contentDescription = null, tint = Tokens.slate)
        Spacer(Modifier.height(0.dp))
        Text("  $message", style = MaterialTheme.typography.bodySmall)
    }
}
