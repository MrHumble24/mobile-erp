package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import uz.malika.erp.features.devconsole.DevAccess
import uz.malika.erp.shared.ui.AppFormField
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton

/** The access-code gate shown before the console in release builds. */
@Composable
fun DevCodeGate(onClose: () -> Unit) {
    var code by remember { mutableStateOf("") }
    var error by remember { mutableStateOf(false) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(Modifier.widthIn(max = 420.dp).fillMaxWidth()) {
            Text("Developer settings", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(24.dp))
            AppFormField(
                label = "Access code",
                value = code,
                onValueChange = { code = it; error = false },
                keyboardType = KeyboardType.NumberPassword,
                imeAction = ImeAction.Done,
                visualTransformation = PasswordVisualTransformation(),
                error = if (error) "Wrong code" else null,
            )
            Spacer(Modifier.height(16.dp))
            PillButton(
                text = "Unlock",
                onClick = { if (!DevAccess.unlock(code)) error = true },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(8.dp))
            PillButton("Back", onClose, variant = ButtonVariant.GHOST)
        }
    }
}
