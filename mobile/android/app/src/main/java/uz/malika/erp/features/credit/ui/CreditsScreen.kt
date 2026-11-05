package uz.malika.erp.features.credit.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.credit.data.CreditApi
import uz.malika.erp.features.credit.data.CreditRepository
import uz.malika.erp.features.credit.data.CreditStatus
import uz.malika.erp.features.credit.model.CreditListViewModel
import uz.malika.erp.i18n.LocalT
import androidx.compose.ui.text.input.ImeAction
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppTextField
import uz.malika.erp.shared.ui.EmptyView
import uz.malika.erp.shared.ui.ErrorView
import uz.malika.erp.shared.ui.Loading
import uz.malika.erp.shared.ui.TabChipItem
import uz.malika.erp.shared.ui.TabChips
import uz.malika.erp.ui.theme.Tokens

/** Customer-credit list (More tab, perm `sale.read`): status tabs + customer search. */
@Composable
fun CreditsScreen(container: AppContainer) {
    val t = LocalT.current
    val repo = remember { CreditRepository(container.retrofit.create(CreditApi::class.java)) }
    val vm: CreditListViewModel = viewModel(factory = viewModelFactory { initializer { CreditListViewModel(repo) } })
    val status by vm.status.collectAsState()
    val search by vm.search.collectAsState()
    val state by vm.state.collectAsState()
    var openId by remember { mutableStateOf<String?>(null) }

    Column(Modifier.fillMaxSize()) {
        Spacer(Modifier.height(Tokens.Space.md))
        TabChips(
            items = CreditStatus.entries.map { TabChipItem(it, t(it.labelKey, null)) },
            selected = status,
            onSelect = { vm.setStatus(it) },
        )
        Spacer(Modifier.height(Tokens.Space.sm))
        AppTextField(
            value = search,
            onValueChange = { vm.setSearch(it) },
            placeholder = t("pos.searchCustomer", null),
            imeAction = ImeAction.Search,
            modifier = Modifier.padding(horizontal = Tokens.Space.screenH),
        )
        Spacer(Modifier.height(Tokens.Space.sm))
        when {
            state.loading -> Loading()
            state.error != null -> ErrorView(state.error!!, retryLabel = t("common.retry", null), onRetry = vm::refresh)
            else -> {
                val rows = vm.visible()
                if (rows.isEmpty()) {
                    EmptyView(t("credit.noCredits", null))
                } else {
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(Tokens.Space.screenH),
                        verticalArrangement = Arrangement.spacedBy(Tokens.Space.sm),
                    ) {
                        items(rows, key = { it.id }) { CreditListRow(it) { openId = it.id } }
                    }
                }
            }
        }
    }

    openId?.let { id ->
        AppBottomSheet(onDismiss = { openId = null }) {
            CreditDetailSheet(container, id, onChanged = { vm.refresh() })
        }
    }
}
