package uz.malika.erp.features.admin.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CloudDone
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.data.local.OutboxEntity
import uz.malika.erp.features.admin.model.ConflictRow
import uz.malika.erp.features.admin.model.SyncViewModel
import uz.malika.erp.features.admin.model.adminViewModelFactory
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.StatusChip
import uz.malika.erp.ui.theme.Tokens

/** Sync status: manual trigger, live offline outbox, and (sync.resolve) conflict inbox. */
@Composable
fun SyncScreen(container: AppContainer) {
    val t = LocalT.current
    val factory = remember(container) { adminViewModelFactory(container) }
    val vm: SyncViewModel = viewModel(factory = factory)
    val online by container.connectivity.online.collectAsStateWithLifecycle()
    val outbox by vm.outbox.collectAsStateWithLifecycle()
    val canResolve = LocalCan.current("sync.resolve")

    LaunchedEffect(canResolve) { if (canResolve) vm.loadConflicts() }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Icon(
                if (online) Icons.Outlined.CloudDone else Icons.Outlined.CloudOff,
                contentDescription = null,
                tint = if (online) Tokens.success else Tokens.ash,
            )
            Spacer(Modifier.height(0.dp))
            Text(
                t(if (online) "common.online" else "common.offline", null),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(start = 8.dp).weight(1f),
            )
            PillButton(t("common.syncNow", null), onClick = vm::syncNow, enabled = online)
        }

        Spacer(Modifier.height(24.dp))
        Text(t("common.syncQueue", null), style = MaterialTheme.typography.titleSmall)
        Spacer(Modifier.height(8.dp))
        if (outbox.isEmpty()) {
            EmptyView(t("common.noQueue", null))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                outbox.forEach { QueueRow(it) }
            }
        }

        if (canResolve) {
            Spacer(Modifier.height(24.dp))
            Text(t("common.conflicts", null), style = MaterialTheme.typography.titleSmall)
            Spacer(Modifier.height(8.dp))
            val conflicts by vm.conflicts.collectAsStateWithLifecycle()
            AsyncContent(conflicts, onRetry = vm::loadConflicts) { rows ->
                if (rows.isEmpty()) {
                    EmptyView(t("common.noConflicts", null))
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        rows.forEach { ConflictCard(vm, it) }
                    }
                }
            }
        }
    }
}

@Composable
private fun QueueRow(row: OutboxEntity) {
    val t = LocalT.current
    val (color, label) = when (row.status) {
        "conflict" -> Tokens.warning to t("common.statusConflict", null)
        "rejected" -> Tokens.danger to t("common.statusRejected", null)
        else -> Tokens.ash to t("common.statusPending", null)
    }
    AppCard {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(row.type, style = MaterialTheme.typography.bodyMedium)
                row.lastError?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = Tokens.danger) }
            }
            StatusChip(label, color = color)
        }
    }
}

@Composable
private fun ConflictCard(vm: SyncViewModel, row: ConflictRow) {
    val t = LocalT.current
    val scope = rememberCoroutineScope()
    AppCard {
        Text(row.type, style = MaterialTheme.typography.titleSmall)
        Text(row.code, style = MaterialTheme.typography.bodySmall)
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PillButton(
                t("common.keepServer", null),
                variant = ButtonVariant.OUTLINE,
                modifier = Modifier.weight(1f),
                onClick = { scope.launch { runCatching { vm.resolve(row.id, "keep-server") } } },
            )
            PillButton(
                t("common.applyTerminal", null),
                modifier = Modifier.weight(1f),
                onClick = { scope.launch { runCatching { vm.resolve(row.id, "apply-terminal") } } },
            )
        }
    }
}
