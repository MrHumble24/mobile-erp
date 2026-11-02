package uz.malika.erp.features.inventory.model

import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import uz.malika.erp.AppContainer
import uz.malika.erp.features.inventory.data.CatalogRepository
import uz.malika.erp.features.inventory.data.DeviceRepository
import uz.malika.erp.features.inventory.data.InventoryApi
import uz.malika.erp.features.inventory.data.StockAlertRepository

/**
 * Wires the slice's repositories (one slice-local API client) and exposes a
 * [ViewModelProvider.Factory] for the three inventory ViewModels. Built once per
 * container; the screen obtains its ViewModels from [factory].
 */
class InventoryViewModels(container: AppContainer) {

    private val api = container.retrofit.create(InventoryApi::class.java)
    private val deviceRepo = DeviceRepository(api, container.db.deviceDao())
    private val catalogRepo = CatalogRepository(api)
    private val alertRepo = StockAlertRepository(api)

    val factory: ViewModelProvider.Factory = viewModelFactory {
        initializer { DevicesViewModel(deviceRepo) }
        initializer { CatalogViewModel(catalogRepo) }
        initializer { StockAlertsViewModel(alertRepo) }
    }
}
