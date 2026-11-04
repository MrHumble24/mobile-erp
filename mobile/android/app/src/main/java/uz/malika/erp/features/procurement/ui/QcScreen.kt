package uz.malika.erp.features.procurement.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.procurement.data.LookupDto
import uz.malika.erp.features.procurement.data.ProcurementRepository
import uz.malika.erp.features.procurement.model.AsyncContent
import uz.malika.erp.features.procurement.model.AsyncValue
import uz.malika.erp.features.procurement.model.QcViewModel
import uz.malika.erp.features.procurement.model.StatsPreset
import uz.malika.erp.features.procurement.model.procurementVmFactory
import uz.malika.erp.features.procurement.model.rememberAsync
import uz.malika.erp.features.procurement.model.rememberProcurementRepository
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.ScannerField
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.shared.ui.Toaster
import uz.malika.erp.ui.theme.Tokens

private enum class QcTab { QUEUE, INSPECTIONS, STATS }

private sealed interface QcSheet {
    data class Grade(val imei: String) : QcSheet
    data class Lookup(val kind: String, val existing: LookupDto?) : QcSheet
}

/**
 * `qc` route: scan header over three segments (queue / inspections / stats).
 * The reference data (grades, defect types) is a manager-only sub-page reached
 * from a link card, not a fourth segment — four labels truncated at phone
 * width. System Back returns from it. Gated `qc.read`.
 */
@Composable
fun QcScreen(container: AppContainer) {
    val t = LocalT.current
    val online by container.connectivity.online.collectAsState()
    val canManage = LocalCan.current("settings.manage")

    val repo = rememberProcurementRepository(container)
    val vm: QcViewModel = viewModel(factory = procurementVmFactory { QcViewModel(repo) })
    val queue by vm.queue.collectAsState()
    val inspections by vm.inspections.collectAsState()
    val stats by vm.stats.collectAsState()
    val grades by vm.grades.collectAsState()
    val defects by vm.defects.collectAsState()

    val modelsState = rememberAsync(Unit) { repo.deviceModels() }
    val modelNames = (modelsState as? AsyncValue.Data)?.value?.associate { it.id to it.label } ?: emptyMap()

    var tab by rememberSaveable { mutableStateOf(QcTab.QUEUE) }
    var lookupsOpen by rememberSaveable { mutableStateOf(false) }
    var preset by remember { mutableStateOf(StatsPreset.SEVEN_DAYS) }
    var customRange by remember { mutableStateOf(DateRange()) }
    var sheet by remember { mutableStateOf<QcSheet?>(null) }

    // Incoming cross-feature arg (e.g. device sheet → "Run QC") opens the grade sheet.
    LaunchedEffect(Unit) {
        container.featureNav.consumeArg("qc")?.let { sheet = QcSheet.Grade(it) }
    }
    BackHandler(enabled = lookupsOpen) { lookupsOpen = false }

    if (lookupsOpen) {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = Tokens.Space.sm, vertical = Tokens.Space.xs),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = { lookupsOpen = false }) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = t("common.close", null), tint = Tokens.text)
                }
                Text(t("qc.tabLookups", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text)
            }
            AsyncContent(grades, onRetry = vm::refreshLookups) { gradeRows ->
                QcLookupsTab(
                    grades = gradeRows,
                    defects = (defects as? AsyncValue.Data)?.value ?: emptyList(),
                    includeInactive = vm.includeInactive,
                    canManage = canManage,
                    onToggleInactive = vm::setIncludeInactive,
                    onAdd = { kind -> sheet = QcSheet.Lookup(kind, null) },
                    onEdit = { kind, row -> sheet = QcSheet.Lookup(kind, row) },
                )
            }
        }
    } else {
        Column(Modifier.fillMaxSize()) {
            ScannerField(
                onScan = { code, _ -> sheet = QcSheet.Grade(code) },
                placeholder = t("qc.scanPlaceholder", null),
                modifier = Modifier.fillMaxWidth().padding(horizontal = Tokens.Space.screenH, vertical = Tokens.Space.md),
            )
            SegmentedControl(
                options = listOf(
                    SegmentOption(QcTab.QUEUE, t("qc.tabQueue", null)),
                    SegmentOption(QcTab.INSPECTIONS, t("qc.tabInspections", null)),
                    SegmentOption(QcTab.STATS, t("qc.tabStats", null)),
                ),
                selected = tab,
                onSelect = { tab = it },
                modifier = Modifier.padding(horizontal = Tokens.Space.screenH),
            )
            Spacer(Modifier.height(Tokens.Space.xs))
            when (tab) {
                QcTab.QUEUE -> AsyncContent(queue, onRetry = vm::refreshQueue) {
                    QcQueueTab(it, modelNames, vm::loadMoreQueue, onGrade = { imei -> sheet = QcSheet.Grade(imei) }) {
                        if (canManage) LookupsLink(t("qc.tabLookups", null)) { lookupsOpen = true }
                    }
                }
                QcTab.INSPECTIONS -> AsyncContent(inspections, onRetry = vm::refreshInspections) {
                    QcInspectionsTab(it, vm.resultFilter, vm::setResultFilter, vm::loadMoreInspections)
                }
                QcTab.STATS -> AsyncContent(stats, onRetry = { vm.refreshStats(preset) }) {
                    QcStatsTab(
                        stats = it,
                        preset = preset,
                        range = customRange,
                        onPreset = { p -> preset = p; vm.refreshStats(p) },
                        onCustomRange = { r -> customRange = r; vm.setStatsRange(r.startMillis, r.endMillis) },
                    )
                }
            }
        }
    }

    QcSheets(sheet, online, repo, preset, vm, container.toaster) { sheet = it }
}

/** Link card to the manager-only reference data (grades, defect types). */
@Composable
private fun LookupsLink(label: String, onClick: () -> Unit) {
    AppCard(Modifier.fillMaxWidth(), onClick = onClick) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = MaterialTheme.typography.titleSmall, color = Tokens.text, modifier = Modifier.weight(1f))
            Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Tokens.muted)
        }
    }
}

@Composable
private fun QcSheets(
    sheet: QcSheet?,
    online: Boolean,
    repo: ProcurementRepository,
    preset: StatsPreset,
    vm: QcViewModel,
    toaster: Toaster,
    setSheet: (QcSheet?) -> Unit,
) {
    val dismiss = { setSheet(null) }
    when (sheet) {
        null -> Unit
        is QcSheet.Grade -> GradeDeviceSheet(
            imei = sheet.imei, online = online, repo = repo, toaster = toaster,
            onSaved = {
                vm.refreshQueue(); vm.refreshInspections(); vm.refreshStats(preset)
            },
            onDismiss = dismiss,
        )
        is QcSheet.Lookup -> LookupFormSheet(
            kind = sheet.kind, existing = sheet.existing, online = online, repo = repo,
            onSaved = vm::refreshLookups, onDismiss = dismiss,
        )
    }
}
