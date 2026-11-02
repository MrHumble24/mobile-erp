import { http } from "@/shared/api/http"
import type {
  CreateRoleDto,
  CreateUserDto,
  PaginatedUsers,
  PermissionView,
  ResetPasswordDto,
  RoleView,
  SetPermissionsDto,
  SetRolesDto,
  UpdateRoleDto,
  UpdateUserDto,
  UserListFilters,
  UserPermissionBreakdown,
  UserStats,
  UserView,
} from "../model/user.types"

export const userRepository = {
  /** Flat list for selectors (cashier/inspector dropdowns). */
  list: async (): Promise<UserView[]> => {
    const res = await http<PaginatedUsers>("/users", { params: { pageSize: 200 } })
    return res.items
  },

  listPage: async (filters: UserListFilters): Promise<PaginatedUsers> => {
    return http<PaginatedUsers>("/users", {
      params: {
        search: filters.search,
        role: filters.role,
        active: filters.active === undefined ? undefined : String(filters.active),
        page: filters.page,
        pageSize: filters.pageSize,
      },
    })
  },

  stats: async (): Promise<UserStats> => {
    return http<UserStats>("/users/stats")
  },

  get: async (id: string): Promise<UserView> => {
    return http<UserView>(`/users/${id}`)
  },

  effectivePermissions: async (
    id: string
  ): Promise<UserPermissionBreakdown> => {
    return http<UserPermissionBreakdown>(`/users/${id}/effective-permissions`)
  },

  resetPassword: async (id: string, dto: ResetPasswordDto): Promise<void> => {
    return http<void>(`/users/${id}/password`, { method: "POST", body: dto })
  },

  create: async (dto: CreateUserDto): Promise<UserView> => {
    return http<UserView>("/users", {
      method: "POST",
      body: dto,
    })
  },

  update: async (id: string, dto: UpdateUserDto): Promise<UserView> => {
    return http<UserView>(`/users/${id}`, {
      method: "PATCH",
      body: dto,
    })
  },

  setRoles: async (id: string, dto: SetRolesDto): Promise<UserView> => {
    return http<UserView>(`/users/${id}/roles`, {
      method: "PUT",
      body: dto,
    })
  },

  setPermissions: async (
    id: string,
    dto: SetPermissionsDto
  ): Promise<UserView> => {
    return http<UserView>(`/users/${id}/permissions`, {
      method: "PUT",
      body: dto,
    })
  },

  listRoles: async (): Promise<RoleView[]> => {
    return http<RoleView[]>("/access/roles")
  },

  listPermissions: async (): Promise<PermissionView[]> => {
    return http<PermissionView[]>("/access/permissions")
  },

  createRole: async (dto: CreateRoleDto): Promise<RoleView> => {
    return http<RoleView>("/access/roles", {
      method: "POST",
      body: dto,
    })
  },

  renameRole: async (code: string, dto: UpdateRoleDto): Promise<RoleView> => {
    return http<RoleView>(`/access/roles/${code}`, {
      method: "PATCH",
      body: dto,
    })
  },

  setRolePermissions: async (
    code: string,
    permissionCodes: string[]
  ): Promise<RoleView> => {
    return http<RoleView>(`/access/roles/${code}/permissions`, {
      method: "PUT",
      body: { permissionCodes },
    })
  },

  deleteRole: async (code: string): Promise<void> => {
    return http<void>(`/access/roles/${code}`, {
      method: "DELETE",
    })
  },
}
