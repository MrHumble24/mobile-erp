package uz.malika.erp.features.devpanel

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.BugReport
import androidx.compose.material.icons.outlined.Cloud
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppEnv
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

// ponytail: a client-side gate to keep the panel out of casual reach — NOT a
// security boundary. Anything truly sensitive stays server-side.
private const val DEV_PANEL_CODE = "153535"

/**
 * Hidden developer panel, reachable from login without signing in. Behind the
 * access code it switches the backend environment and edits each env's API base
 * URL. Changes persist and apply at runtime (the HTTP client reads the live URL).
 */
@Composable
fun DevPanelScreen(container: AppContainer, onClose: () -> Unit) {
    val t = LocalT.current

    var code by remember { mutableStateOf("") }
    var unlocked by remember { mutableStateOf(false) }
    var codeError by remember { mutableStateOf(false) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(Modifier.widthIn(max = 420.dp).fillMaxWidth()) {
            Text(t("auth.devPanelTitle", null), style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(24.dp))

            if (!unlocked) {
                AppFormField(
                    label = t("auth.devPanelPassword", null),
                    value = code,
                    onValueChange = { code = it; codeError = false },
                    keyboardType = KeyboardType.NumberPassword,
                    imeAction = ImeAction.Done,
                    visualTransformation = PasswordVisualTransformation(),
                    error = if (codeError) t("auth.devPanelWrongPassword", null) else null,
                )
                Spacer(Modifier.height(16.dp))
                PillButton(
                    text = t("auth.devPanelUnlock", null),
                    onClick = {
                        if (code.trim() == DEV_PANEL_CODE) unlocked = true else codeError = true
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
            } else {
                DevForm(container, onClose, t)
            }

            Spacer(Modifier.height(8.dp))
            PillButton(t("common.back", null), onClose, variant = ButtonVariant.GHOST)
        }
    }
}

@Composable
private fun DevForm(
    container: AppContainer,
    onClose: () -> Unit,
    t: (String, Map<String, Any?>?) -> String,
) {
    val cfg = container.devConfig.state.value
    var env by remember { mutableStateOf(cfg.env) }
    var prodUrl by remember { mutableStateOf(cfg.prodUrl) }
    var devUrl by remember { mutableStateOf(cfg.devUrl) }
    var saved by remember { mutableStateOf(false) }

    Text(t("auth.devEnvironment", null), style = MaterialTheme.typography.titleSmall)
    Spacer(Modifier.height(8.dp))
    SegmentedControl(
        options = listOf(
            SegmentOption(AppEnv.PRODUCTION, t("auth.envProduction", null), Icons.Outlined.Cloud),
            SegmentOption(AppEnv.DEVELOPMENT, t("auth.envDevelopment", null), Icons.Outlined.BugReport),
        ),
        selected = env,
        onSelect = { env = it; saved = false },
    )
    Spacer(Modifier.height(24.dp))
    AppFormField(
        label = t("auth.devApiUrlProd", null),
        value = prodUrl,
        onValueChange = { prodUrl = it; saved = false },
        keyboardType = KeyboardType.Uri,
    )
    Spacer(Modifier.height(16.dp))
    AppFormField(
        label = t("auth.devApiUrlDev", null),
        value = devUrl,
        onValueChange = { devUrl = it; saved = false },
        keyboardType = KeyboardType.Uri,
    )
    Spacer(Modifier.height(24.dp))
    PillButton(
        text = t("common.save", null),
        onClick = {
            container.devConfig.save(env, prodUrl, devUrl)
            saved = true
        },
        modifier = Modifier.fillMaxWidth(),
    )
    if (saved) {
        Spacer(Modifier.height(8.dp))
        Text(t("auth.devSaved", null), style = MaterialTheme.typography.bodySmall, color = Tokens.success)
    }
}
