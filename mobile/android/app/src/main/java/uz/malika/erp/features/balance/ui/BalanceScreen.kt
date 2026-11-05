package uz.malika.erp.features.balance.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.app.LocalCan
import uz.malika.erp.features.balance.model.BalanceEvent
import uz.malika.erp.features.balance.model.BalanceViewModel
import uz.malika.erp.features.balance.model.LedgerAction
import uz.malika.erp.features.balance.model.ledgerRangeFrom
import uz.malika.erp.features.balance.model.ledgerRangeTo
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.DateRange
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.FilterButton
import uz.malika.erp.shared.ui.LoadMoreFooter
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.OfflineBanner
import uz.malika.erp.shared.ui.listBottomPadding
import uz.malika.erp.ui.theme.Tokens

/**
 * Store balance (perm `balance.read`): the cash/card/total card, then the paged
 * history with account/type/date filters and pull-to-refresh. With
 * `balance.manage` the "+" opens the manual actions (opening / deposit /
 * withdraw / correction / transfer). Online-only — offline shows the usual
 * offline state and the writes are refused in the ViewModel, never queued.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BalanceScreen(container: AppContainer) {
    val t = LocalT.current
    val canManage = LocalCan.current("balance.manage")
    val online by container.connectivity.online.collectAsState()
    val vm: BalanceViewModel = viewModel(
        factory = viewModelFactory { initializer { BalanceViewModel(container) } },
    )
    val state by vm.state.collectAsState()

    LaunchedEffect(vm) {
        vm.events.collect { event ->
            when (event) {
                is BalanceEvent.Message -> container.toaster.success(t(event.key, null))
                is BalanceEvent.Failure -> container.toaster.error(event.text)
            }
        }
    }

    var showFilters by remember { mutableStateOf(false) }
    var picking by remember { mutableStateOf(false) }
    var entryAction by remember { mutableStateOf<LedgerAction?>(null) }
    var transferring by remember { mutableStateOf(false) }
    var range by remember { mutableStateOf(DateRange()) }

    val filter = state.filter
    val accounts = state.balances?.accounts ?: emptyList()
    val items = state.page.items
    val activeFilters = listOf(filter.accountCode != null, filter.typeCode != null, filter.fromIso != null).count { it }

    val pullState = rememberPullToRefreshState()
    PullToRefreshBox(
        isRefreshing = state.refreshing,
        onRefresh = vm::refresh,
        state = pullState,
        modifier = Modifier.fillMaxSize().background(Tokens.ground),
        indicator = {
            PullToRefreshDefaults.Indicator(
                state = pullState,
                isRefreshing = state.refreshing,
                modifier = Modifier.align(Alignment.TopCenter),
                containerColor = Tokens.card,
                color = Tokens.text,
            )
        },
    ) {
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = Tokens.Space.screenH,
                end = Tokens.Space.screenH,
                top = Tokens.Space.md,
                bottom = listBottomPadding().calculateBottomPadding(),
            ),
            verticalArrangement = Arrangement.spacedBy(Tokens.Space.lg),
        ) {
            item {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.CenterVertically) {
                    FilterButton(activeCount = activeFilters, onClick = { showFilters = true })
                    if (canManage) {
                        IconButton(onClick = { picking = true }) {
                            Icon(Icons.Outlined.Add, contentDescription = t("balance.newEntry", null), tint = Tokens.text)
                        }
                    }
                }
            }
            item { BalanceAccountsCard(state.balances) }
            item { Text(t("balance.history", null), style = MaterialTheme.typography.titleMedium, color = Tokens.text) }
            when {
                !online && state.balances == null && items.isEmpty() ->
                    item { OfflineBanner(t("common.offline", null)) }
                state.page.loading && items.isEmpty() ->
                    item { Box(Modifier.fillMaxWidth().height(160.dp), contentAlignment = Alignment.Center) { Loading() } }
                state.error != null && items.isEmpty() ->
                    item { ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::reload) }
                items.isEmpty() ->
                    item { AppCard(Modifier.fillMaxWidth()) { EmptyView(t("balance.emptyHistory", null), compact = true) } }
                else -> {
                    items(items, key = { it.id }) { txn -> LedgerRow(txn) }
                    item { LoadMoreFooter(state.page.hasMore, state.page.loading, vm::loadMore) }
                }
            }
        }
    }

    if (showFilters) {
        LedgerFiltersSheet(
            accounts = accounts,
            filter = filter,
            range = range,
            onAccount = { vm.setFilter(filter.copy(accountCode = it)) },
            onType = { vm.setFilter(filter.copy(typeCode = it)) },
            onRange = {
                range = it
                vm.setFilter(filter.copy(fromIso = ledgerRangeFrom(it.startMillis), toIso = ledgerRangeTo(it.endMillis)))
            },
            canReset = activeFilters > 0,
            onReset = { range = DateRange(); vm.clearFilters() },
            onDismiss = { showFilters = false },
        )
    }
    if (picking) {
        EntryActionSheet(
            onPick = { entryAction = it; picking = false },
            onTransfer = { transferring = true; picking = false },
            onDismiss = { picking = false },
        )
    }
    entryAction?.let { action ->
        LedgerEntrySheet(action = action, accounts = accounts, vm = vm, onDismiss = { entryAction = null })
    }
    if (transferring) {
        TransferSheet(accounts = accounts, vm = vm, onDismiss = { transferring = false })
    }
}
