package uz.malika.erp.features.nasiya.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.draw.clip
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
        Text(t("consignments.partner", null), style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(Tokens.Space.sm))
        AppTextField(value = query, onValueChange = { query = it }, placeholder = t("consignments.selectPartner", null))
        Spacer(Modifier.height(Tokens.Space.sm))
        Column(
            Modifier.fillMaxWidth().heightIn(max = 180.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.xs),
        ) {
            matches.forEach { (id, name) ->
                val selected = id == selectedId
                Text(
                    name,
                    style = if (selected) MaterialTheme.typography.titleSmall else MaterialTheme.typography.bodyMedium,
                    color = Tokens.text,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(Tokens.Radius.controls))
                        .background(if (selected) Tokens.surface2 else Tokens.card)
                        .clickable { onSelect(id) }
                        .heightIn(min = Tokens.minTouch)
                        .padding(horizontal = Tokens.Space.md, vertical = Tokens.Space.md),
                )
            }
        }
    }
}
