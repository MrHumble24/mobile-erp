package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uz.malika.erp.features.admin.model.Async
import uz.malika.erp.features.admin.model.UsersViewModel
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.MetricGrid
import uz.malika.erp.shared.ui.MetricTile
import uz.malika.erp.ui.theme.Tokens

/** Summary metric cards for the users list (total / active / inactive). */
@Composable
fun UsersSummary(vm: UsersViewModel) {
    val t = LocalT.current
    val stats by vm.stats.collectAsStateWithLifecycle()
    val data = (stats as? Async.Ok)?.value ?: return

    MetricGrid(
        modifier = Modifier.fillMaxWidth().padding(horizontal = Tokens.Space.screenH),
        perRow = 3,
        tiles = listOf(
            { m -> MetricTile(t("users.statTotal", null), data.total.toString(), m, money = false) },
            { m -> MetricTile(t("users.statActive", null), data.active.toString(), m, money = false) },
            { m -> MetricTile(t("users.statInactive", null), (data.total - data.active).toString(), m, money = false) },
        ),
    )
}
