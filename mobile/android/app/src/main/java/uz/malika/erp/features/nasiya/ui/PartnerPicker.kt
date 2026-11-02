package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.ui.theme.Tokens

/**
 * A filterable partner chooser built from [Tokens] (the kit has no Select yet —
 * integrator may promote this). Reads partners the caller pulled from the local
 * mirror, so it works offline. `active`-only filtering is unavailable because
 * the mirror does not carry isActive (see notes).
 */
@Composable
fun PartnerPicker(
    partners: List<Pair<String, String>>,
    selectedId: String,
    onSelect: (String) -> Unit,
) {
    val t = LocalT.current
    var query by remember { mutableStateOf("") }
    val matches = partners.filter { query.isBlank() || it.second.contains(query.trim(), ignoreCase = true) }

    Column {
        Text(t("consignments.partner", null), style = MaterialTheme.typography.labelLarge)
        AppTextField(value = query, onValueChange = { query = it }, placeholder = t("consignments.selectPartner", null))
        Column(
            Modifier.fillMaxWidth().heightIn(max = 160.dp).verticalScroll(rememberScrollState()),
        ) {
            matches.forEach { (id, name) ->
                val selected = id == selectedId
                Text(
                    name,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                    color = if (selected) Tokens.signalBlue else Tokens.foreground,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelect(id) }
                        .background(
                            if (selected) Tokens.signalBlue.copy(alpha = 0.08f) else Tokens.surfaceCanvas,
                            RoundedCornerShape(8.dp),
                        )
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                )
            }
        }
    }
}
