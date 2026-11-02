package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import uz.malika.erp.AppContainer
import uz.malika.erp.BuildConfig
import uz.malika.erp.core.AppEnv
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/** Read-only build/session facts: active URL, app version, build, terminal id. */
@Composable
fun EnvInfoCard(container: AppContainer, viewed: AppEnv) {
    AppCard(Modifier.fillMaxWidth()) {
        InfoRow("Active base URL", container.devConfig.currentBaseUrl)
        InfoRow("Viewing", viewed.name.lowercase())
        InfoRow("App version", "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})")
        InfoRow("Build type", if (BuildConfig.DEBUG) "debug" else "release")
        InfoRow("Terminal id", container.terminalId.get(), mono = true)
    }
}

@Composable
private fun InfoRow(label: String, value: String, mono: Boolean = false) {
    Row(Modifier.fillMaxWidth()) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = Tokens.slate, modifier = Modifier.weight(1f))
        Text(
            text = value,
            style = if (mono) {
                MaterialTheme.typography.bodyMedium.copy(fontFamily = MonoFamily)
            } else {
                MaterialTheme.typography.bodyMedium
            },
            textAlign = TextAlign.End,
            modifier = Modifier.weight(1.4f),
        )
    }
    Spacer(Modifier.height(8.dp))
}
