package uz.malika.erp.features.admin.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.admin.data.CreateUserBody
import uz.malika.erp.features.admin.data.OverrideBody
import uz.malika.erp.features.admin.data.ProfileBody
import uz.malika.erp.features.admin.data.UserDto
import uz.malika.erp.features.admin.data.UserStatsDto
import uz.malika.erp.features.admin.data.UsersRepository
import uz.malika.erp.core.AppException
import uz.malika.erp.shared.lib.DEFAULT_PAGE_SIZE
import uz.malika.erp.shared.lib.PageState

/** The Users tab: filtered, paginated list + stats + the write actions on a user. */
class UsersViewModel(private val repo: UsersRepository) : ViewModel() {

    data class Filters(val search: String = "", val role: String? = null, val active: Boolean? = null)

    private val _filters = MutableStateFlow(Filters())
    val filters: StateFlow<Filters> = _filters.asStateFlow()

    private val _users = MutableStateFlow<Async<PageState<UserDto>>>(Async.Loading)
    val users: StateFlow<Async<PageState<UserDto>>> = _users.asStateFlow()

    private val _stats = MutableStateFlow<Async<UserStatsDto>>(Async.Loading)
    val stats: StateFlow<Async<UserStatsDto>> = _stats.asStateFlow()

    private var searchJob: Job? = null

    init {
        load()
        loadStats()
    }

    /** (Re)load the first page for the current filters. */
    fun load() {
        val f = _filters.value
        viewModelScope.launch {
            _users.value = asyncOf {
                val dto = repo.listUsers(f.search, f.role, f.active, page = 1, pageSize = DEFAULT_PAGE_SIZE)
                PageState<UserDto>().append(dto.items, dto.total, 1)
            }
        }
    }

    /** Append the next page; no-op while loading, failed, or complete. */
    fun loadMore() {
        val current = (_users.value as? Async.Ok)?.value ?: return
        if (!current.hasMore || current.loading) return
        _users.value = Async.Ok(current.copy(loading = true))
        val f = _filters.value
        viewModelScope.launch {
            val next = current.nextPage
            try {
                val dto = repo.listUsers(f.search, f.role, f.active, page = next, pageSize = DEFAULT_PAGE_SIZE)
                _users.value = Async.Ok(current.append(dto.items, dto.total, next))
            } catch (_: AppException) {
                _users.value = Async.Ok(current.copy(loading = false))
            }
        }
    }

    fun loadStats() {
        viewModelScope.launch { _stats.value = asyncOf { repo.stats() } }
    }

    fun setSearch(value: String) {
        _filters.value = _filters.value.copy(search = value)
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300) // debounce keystrokes
            load()
        }
    }

    fun setRole(role: String?) {
        _filters.value = _filters.value.copy(role = role)
        load()
    }

    fun setActive(active: Boolean?) {
        _filters.value = _filters.value.copy(active = active)
        load()
    }

    fun reset() {
        _filters.value = Filters()
        load()
    }

    private fun refreshAll() {
        load()
        loadStats()
    }

    suspend fun create(body: CreateUserBody) {
        repo.createUser(body)
        refreshAll()
    }

    suspend fun setActive(id: String, isActive: Boolean) {
        repo.setActive(id, isActive)
        refreshAll()
    }

    suspend fun updateProfile(id: String, profile: ProfileBody) {
        repo.updateProfile(id, profile)
        load()
    }

    suspend fun setRoles(id: String, roleCodes: List<String>) {
        repo.setRoles(id, roleCodes)
        refreshAll()
    }

    suspend fun setPermissions(id: String, overrides: List<OverrideBody>) {
        repo.setPermissions(id, overrides)
    }

    suspend fun resetPassword(id: String, password: String) {
        repo.resetPassword(id, password)
    }

    suspend fun effectivePermissions(id: String) = repo.effectivePermissions(id)
}
