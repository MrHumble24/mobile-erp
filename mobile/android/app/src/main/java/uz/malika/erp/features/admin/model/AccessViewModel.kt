package uz.malika.erp.features.admin.model

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import uz.malika.erp.features.admin.data.PermissionDto
import uz.malika.erp.features.admin.data.RoleDto
import uz.malika.erp.features.admin.data.UsersRepository

/**
 * Roles + the full permission catalogue, shared by the Roles tab, the Matrix
 * tab and the user/role permission editors. Permissions are read-only; roles
 * carry create / rename / set-permissions / delete.
 */
class AccessViewModel(private val repo: UsersRepository) : ViewModel() {

    private val _roles = MutableStateFlow<Async<List<RoleDto>>>(Async.Loading)
    val roles: StateFlow<Async<List<RoleDto>>> = _roles.asStateFlow()

    private val _permissions = MutableStateFlow<Async<List<PermissionDto>>>(Async.Loading)
    val permissions: StateFlow<Async<List<PermissionDto>>> = _permissions.asStateFlow()

    init {
        loadRoles()
        loadPermissions()
    }

    fun loadRoles() {
        viewModelScope.launch { _roles.value = asyncOf { repo.listRoles() } }
    }

    fun loadPermissions() {
        viewModelScope.launch { _permissions.value = asyncOf { repo.listPermissions() } }
    }

    suspend fun create(code: String, name: String, description: String?) {
        repo.createRole(code, name, description)
        loadRoles()
    }

    suspend fun rename(code: String, name: String, description: String?) {
        repo.renameRole(code, name, description)
        loadRoles()
    }

    suspend fun setPermissions(code: String, permissionCodes: List<String>) {
        repo.setRolePermissions(code, permissionCodes)
        loadRoles()
    }

    suspend fun delete(code: String) {
        repo.deleteRole(code)
        loadRoles()
    }
}
