package uz.malika.erp.features.admin.model

import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.admin.data.AdminApi
import uz.malika.erp.features.admin.data.SettingsRepository
import uz.malika.erp.features.admin.data.UsersRepository

/**
 * Builds this slice's ViewModels from the [AppContainer] (the per-feature
 * pattern from FOUNDATION.md). One factory serves all admin screens; each
 * `viewModel(factory = …)` picks the class it needs.
 */
fun adminViewModelFactory(container: AppContainer): ViewModelProvider.Factory = viewModelFactory {
    val api = container.retrofit.create(AdminApi::class.java)
    val usersRepo = UsersRepository(api)
    val settingsRepo = SettingsRepository(api)
    initializer { UsersViewModel(usersRepo) }
    initializer { AccessViewModel(usersRepo) }
    initializer { SettingsViewModel(settingsRepo) }
    initializer { SyncViewModel(container) }
}
