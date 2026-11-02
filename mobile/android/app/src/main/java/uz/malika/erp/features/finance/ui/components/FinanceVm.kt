package uz.malika.erp.features.finance.ui.components

import androidx.compose.runtime.Composable
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer

/**
 * Builds a feature ViewModel from the [AppContainer], mirroring the foundation
 * `viewModelFactory` pattern so each screen owns its VM without a shared
 * providers file.
 */
@Composable
inline fun <reified VM : ViewModel> financeViewModel(
    container: AppContainer,
    crossinline create: (AppContainer) -> VM,
): VM = viewModel(factory = viewModelFactory { initializer { create(container) } })
