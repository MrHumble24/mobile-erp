package uz.malika.erp.features.devconsole.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.MaterialTheme
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
import uz.malika.erp.features.devconsole.DevAccess
import uz.malika.erp.features.devconsole.DevConsoleSection
import uz.malika.erp.features.devconsole.DevConsoleSections
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl

/**
 * The Developer Console. Behind the access gate (debug: open; release: after the
 * code) it shows one section from [DevConsoleSections] at a time, picked from a
 * single horizontal selector. English-only copy by design — developer tooling.
 */
@Composable
fun DevConsoleScreen(container: AppContainer, onClose: () -> Unit) {
    val unlocked by DevAccess.unlocked.collectAsState()
    if (!unlocked) {
        DevCodeGate(onClose = onClose)
        return
    }

    val sections = DevConsoleSections.all
    var selectedId by remember { mutableStateOf(sections.first().id) }
    val selected = sections.firstOrNull { it.id == selectedId } ?: sections.first()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Developer Console", style = MaterialTheme.typography.headlineSmall, modifier = Modifier.weight(1f))
            PillButton("Close", onClose, variant = ButtonVariant.GHOST)
        }
        Spacer(Modifier.height(12.dp))
        SectionSelector(sections, selected) { selectedId = it }
        Spacer(Modifier.height(12.dp))
        selected.content(container)
    }
}

@Composable
private fun SectionSelector(
    sections: List<DevConsoleSection>,
    selected: DevConsoleSection,
    onSelect: (String) -> Unit,
) {
    Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
        SegmentedControl(
            options = sections.map { SegmentOption(it.id, it.title, it.icon) },
            selected = selected.id,
            onSelect = onSelect,
        )
    }
}
