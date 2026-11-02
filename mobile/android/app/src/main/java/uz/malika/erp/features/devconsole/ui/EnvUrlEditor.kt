package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.malika.erp.AppContainer
import uz.malika.erp.core.AppEnv
import uz.malika.erp.features.devconsole.model.ConnectionProbe
import uz.malika.erp.features.devconsole.model.ProbeResult
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

private val probe = ConnectionProbe()

/** Edit the viewed env's base URL (override), reset to auto, and test it. */
@Composable
fun EnvUrlEditor(container: AppContainer, env: AppEnv) {
    // Re-seed the field whenever the viewed env changes.
    key(env) {
        var url by remember { mutableStateOf(container.devConfig.effectiveUrl(env)) }
        var result by remember { mutableStateOf<ProbeResult?>(null) }
        var testing by remember { mutableStateOf(false) }
        val scope = rememberCoroutineScope()
        val overridden = container.devConfig.isOverridden(env)

        Column(Modifier.fillMaxWidth()) {
            AppFormField(
                label = if (overridden) "Base URL (override)" else "Base URL",
                value = url,
                onValueChange = { url = it; result = null },
                placeholder = "https://host:port",
                keyboardType = KeyboardType.Uri,
            )
            if (env == AppEnv.DEVELOPMENT) {
                Spacer(Modifier.height(6.dp))
                Text(devHostHint(container, overridden), style = MaterialTheme.typography.bodySmall, color = Tokens.slate)
            }
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PillButton("Save", { container.devConfig.setOverride(env, url) }, Modifier.weight(1f))
                PillButton(
                    text = "Reset to auto",
                    onClick = {
                        container.devConfig.resetOverride(env)
                        url = container.devConfig.effectiveUrl(env)
                        result = null
                    },
                    modifier = Modifier.weight(1f),
                    variant = ButtonVariant.OUTLINE,
                )
            }
            Spacer(Modifier.height(8.dp))
            PillButton(
                text = if (testing) "Testing…" else "Test connection",
                onClick = {
                    testing = true
                    scope.launch {
                        result = probe.probe(url)
                        testing = false
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                variant = ButtonVariant.SECONDARY,
                enabled = !testing && url.isNotBlank(),
            )
            result?.let {
                Spacer(Modifier.height(8.dp))
                ProbeResultText(it)
            }
        }
    }
}

@Composable
private fun ProbeResultText(result: ProbeResult) {
    val (text, color) = when (result) {
        is ProbeResult.Reachable -> "Reachable — HTTP ${result.status} in ${result.latencyMs} ms" to Tokens.success
        is ProbeResult.Unreachable -> "Unreachable — ${result.error}" to Tokens.danger
    }
    Text(text, style = MaterialTheme.typography.bodyMedium, color = color)
}

private fun devHostHint(container: AppContainer, overridden: Boolean): String {
    if (overridden) return "Source: override"
    val source = when (uz.malika.erp.core.DevHost.source()) {
        uz.malika.erp.core.HostSource.EMULATOR -> "emulator (10.0.2.2)"
        uz.malika.erp.core.HostSource.AUTO_BUILD_MACHINE -> "auto (build machine ${uz.malika.erp.BuildConfig.DEV_HOST})"
    }
    return "Source: $source"
}
