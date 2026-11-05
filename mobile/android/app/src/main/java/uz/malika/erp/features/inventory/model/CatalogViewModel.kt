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
import uz.malika.erp.features.inventory.data.CategoryBody
import uz.malika.erp.features.inventory.data.DeviceModelView
import uz.malika.erp.features.inventory.data.ModelForm
import uz.malika.erp.features.inventory.data.ProductCategoryDto

/**
 * Online device-model catalog: the Models tab, the device-list model filter,
 * the alert-rule model picker, and the edit-device spec schema all read [models].
 * Also owns the product categories ([categories]) used by the product form and
 * the categories manage sheet.
 */
class CatalogViewModel(private val repo: CatalogRepository) : ViewModel() {

    private val _models = MutableStateFlow<Async<List<DeviceModelView>>>(Async.Loading)
    val models: StateFlow<Async<List<DeviceModelView>>> = _models.asStateFlow()

    private val _categories = MutableStateFlow<List<ProductCategoryDto>>(emptyList())
    val categories: StateFlow<List<ProductCategoryDto>> = _categories.asStateFlow()

    init { refresh() }

    /** Reloads products and categories; the Models-tab retry button drives this. */
    fun refresh() {
        refreshCategories()
        _models.value = Async.Loading
        viewModelScope.launch {
            _models.value = try {
                Async.Data(repo.list())
            } catch (e: AppException) {
                Async.Error(e.message)
            }
        }
    }

    fun refreshCategories() {
        viewModelScope.launch {
            runCatching { repo.categories() }.getOrNull()?.let { _categories.value = it }
        }
    }

    fun attributesOf(modelId: String): List<AttributeDef> =
        _models.value.valueOrNull?.firstOrNull { it.id == modelId }?.attributes ?: emptyList()

    suspend fun create(form: ModelForm) {
        repo.create(form)
        refresh()
    }

    suspend fun update(id: String, form: ModelForm) {
        repo.update(id, form)
        refresh()
    }

    /** Upload / remove a product picture (ADR 0031); returns the refreshed view. */
    suspend fun uploadImage(id: String, bytes: ByteArray, mime: String, filename: String): DeviceModelView {
        val view = repo.uploadImage(id, bytes, mime, filename)
        refresh()
        return view
    }

    suspend fun removeImage(id: String): DeviceModelView {
        val view = repo.removeImage(id)
        refresh()
        return view
    }

    suspend fun addCategory(name: String) {
        repo.createCategory(name)
        refreshCategories()
    }

    suspend fun saveCategory(id: String, body: CategoryBody) {
        repo.updateCategory(id, body)
        refreshCategories()
    }
}
