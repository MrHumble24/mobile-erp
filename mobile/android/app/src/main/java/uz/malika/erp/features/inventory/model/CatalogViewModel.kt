package uz.malika.erp.features.inventory.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.core.AppException
import uz.malika.erp.features.inventory.data.AttributeDef
import uz.malika.erp.features.inventory.data.CatalogRepository
import uz.malika.erp.features.inventory.data.DeviceModelView

/**
 * Online device-model catalog: the Models tab, the device-list model filter,
 * the alert-rule model picker, and the edit-device spec schema all read [models].
 * The list endpoint already carries each model's attributes, so no extra fetch.
 */
class CatalogViewModel(private val repo: CatalogRepository) : ViewModel() {

    private val _models = MutableStateFlow<Async<List<DeviceModelView>>>(Async.Loading)
    val models: StateFlow<Async<List<DeviceModelView>>> = _models.asStateFlow()

    init { refresh() }

    fun refresh() {
        _models.value = Async.Loading
        viewModelScope.launch {
            _models.value = try {
                Async.Data(repo.list())
            } catch (e: AppException) {
                Async.Error(e.message)
            }
        }
    }

    fun attributesOf(modelId: String): List<AttributeDef> =
        _models.value.valueOrNull?.firstOrNull { it.id == modelId }?.attributes ?: emptyList()

    suspend fun create(brand: String, name: String, attributes: List<AttributeDef>) {
        repo.create(brand, name, attributes)
        refresh()
    }

    suspend fun update(
        id: String,
        brand: String,
        name: String,
        isActive: Boolean,
        attributes: List<AttributeDef>,
    ) {
        repo.update(id, brand, name, isActive, attributes)
        refresh()
    }
}
