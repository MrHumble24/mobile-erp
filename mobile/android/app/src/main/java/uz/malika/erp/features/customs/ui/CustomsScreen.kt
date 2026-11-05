package uz.malika.erp.features.customs.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.customs.data.CustomsApi
import uz.malika.erp.features.customs.data.CustomsRepository
import uz.malika.erp.features.finance.ui.components.AsyncContent
import uz.malika.erp.features.finance.ui.components.rememberAsync
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.shared.ui.SegmentOption
import uz.malika.erp.shared.ui.SegmentedControl
import uz.malika.erp.ui.theme.Tokens

private enum class CustomsSection(val labelKey: String) {
    CURRENT("customs.currentList"),
    VERSIONS("customs.versions"),
    UNMATCHED("customs.unmatchedTitle"),
}

/**
 * `customs` route (perm `customs.read`): the current price list per model code,
 * the version history and the models still missing a fee, split across a
 * segmented control. The owner (`customs.manage`) gets a "new price list" button
 * that opens [NewListSheet], pre-filled from the current list; saving reloads
 * every section so the new version shows at once.
 */
@Composable
fun CustomsScreen(container: AppContainer) {
    val t = LocalT.current
    val canManage = LocalCan.current("customs.manage")
    val repo = remember { CustomsRepository(container.retrofit.create(CustomsApi::class.java)) }

    val current = rememberAsync { repo.current() }
    val versions = rememberAsync { repo.versions() }
    val unmatched = rememberAsync { repo.unmatchedModels() }

    var section by remember { mutableStateOf(CustomsSection.CURRENT) }
    var showNewList by remember { mutableStateOf(false) }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(Tokens.Space.section),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.section),
    ) {
        Text(t("customs.title", null), style = MaterialTheme.typography.titleLarge, color = Tokens.text)
        Text(t("customs.pageDescription", null), style = MaterialTheme.typography.bodySmall, color = Tokens.muted)

        if (canManage) {
            PillButton(
                text = t("customs.newList", null),
                onClick = { showNewList = true },
                modifier = Modifier.fillMaxWidth(),
            )
        }

        SegmentedControl(
            options = CustomsSection.entries.map { SegmentOption(it, t(it.labelKey, null)) },
            selected = section,
            onSelect = { section = it },
            modifier = Modifier.fillMaxWidth(),
        )

        when (section) {
            CustomsSection.CURRENT -> AsyncContent(current, retryLabel = t("common.retry", null)) { list ->
                CurrentListSection(list)
            }
            CustomsSection.VERSIONS -> AsyncContent(versions, retryLabel = t("common.retry", null)) { rows ->
                VersionsSection(rows)
            }
            CustomsSection.UNMATCHED -> AsyncContent(unmatched, retryLabel = t("common.retry", null)) { rows ->
                UnmatchedSection(rows)
            }
        }
        Spacer(Modifier.height(Tokens.Space.lg))
    }

    if (showNewList) {
        val currentList = (current.state as? uz.malika.erp.features.finance.ui.components.Async.Data)?.value
        NewListSheet(
            repo = repo,
            prefill = currentList,
            toaster = container.toaster,
            onSaved = {
                current.reload(); versions.reload(); unmatched.reload()
                showNewList = false
            },
            onDismiss = { showNewList = false },
        )
    }
}
