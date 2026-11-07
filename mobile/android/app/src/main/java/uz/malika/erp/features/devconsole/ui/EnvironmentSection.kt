package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.BugReport
import androidx.compose.material.icons.outlined.Cloud
import androidx.compose.material.icons.outlined.Science
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppEnv
import uz.malika.erp.core.SecureStore
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.AppConfirmDialog
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Environment picker, per-env URL override, test connection, and build info. */
@Composable
fun EnvironmentSection(container: AppContainer) {
    val cfg by container.devConfig.state.collectAsState()
    var viewed by remember { mutableStateOf(cfg.env) }
    var confirmSwitch by remember { mutableStateOf(false) }

    val effectiveUrl = container.devConfig.effectiveUrl(viewed)
    val configured = effectiveUrl.isNotBlank()

    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState())) {
        Text("Environment", style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(8.dp))
        SegmentedControl(
            options = listOf(
                SegmentOption(AppEnv.PRODUCTION, "Prod", Icons.Outlined.Cloud),
                SegmentOption(AppEnv.STAGING, "Staging", Icons.Outlined.Science),
                SegmentOption(AppEnv.DEVELOPMENT, "Dev", Icons.Outlined.BugReport),
            ),
            selected = viewed,
            onSelect = { viewed = it },
        )
        Spacer(Modifier.height(8.dp))
        if (viewed == cfg.env) {
            StatusChip("Active", color = Tokens.success)
        } else {
            PillButton(
                text = "Switch to this environment",
                onClick = { confirmSwitch = true },
                enabled = configured,
                modifier = Modifier.fillMaxWidth(),
            )
            if (!configured) {
                Spacer(Modifier.height(6.dp))
                Text("Not configured — enter a URL", style = MaterialTheme.typography.bodySmall, color = Tokens.warning)
            }
        }

        Spacer(Modifier.height(16.dp))
        EnvUrlEditor(container, viewed)

        Spacer(Modifier.height(16.dp))
        AppCard(Modifier.fillMaxWidth()) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("HTTP Cache", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Disabled by default. When off, all requests bypass cache and send no-cache headers.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Tokens.slate,
                    )
                }
                Switch(
                    checked = cfg.isHttpCacheEnabled,
                    onCheckedChange = { container.devConfig.setHttpCacheEnabled(it) },
                )
            }
        }

        Spacer(Modifier.height(20.dp))
        EnvInfoCard(container, viewed)
    }

    if (confirmSwitch) {
        AppConfirmDialog(
            title = "Switch environment?",
            message = "This signs you out — a token from one environment is invalid in another.",
            confirmLabel = "Switch & sign out",
            cancelLabel = "Cancel",
            destructive = true,
            onConfirm = {
                confirmSwitch = false
                container.devConfig.setEnv(viewed)
                container.secure.remove(
                    SecureStore.Keys.TOKEN,
                    SecureStore.Keys.USER,
                )
                container.authEvents.signalUnauthorized()
            },
            onDismiss = { confirmSwitch = false },
        )
    }
}
