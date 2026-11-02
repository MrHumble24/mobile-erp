package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.Tokens

/** Summary metric cards for the users list (total / active / inactive). */
@Composable
fun UsersSummary(vm: UsersViewModel) {
    val t = LocalT.current
    val stats by vm.stats.collectAsStateWithLifecycle()
    val data = (stats as? Async.Ok)?.value ?: return

    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        StatCard(t("users.statTotal", null), data.total.toString(), Modifier.weight(1f))
        StatCard(t("users.statActive", null), data.active.toString(), Modifier.weight(1f))
        StatCard(
            t("users.statInactive", null),
            (data.total - data.active).toString(),
            Modifier.weight(1f),
        )
    }
}

/** Slice-local metric tile (the kit ships no MetricCard — integrator may promote). */
@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    AppCard(modifier = modifier) {
        Column {
            Text(label, style = MaterialTheme.typography.labelMedium, color = Tokens.slate)
            Text(
                value,
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
            )
        }
    }
}
