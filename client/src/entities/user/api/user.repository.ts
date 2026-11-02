import { http } from "@/shared/api/http"
import type {
  CreateRoleDto,
  CreateUserDto,
  PermissionView,
  RoleView,
  SetPermissionsDto,
  SetRolesDto,
  UpdateUserDto,
  UserView,
} from "../model/user.types"

export const userRepository = {
  list: async (): Promise<UserView[]> => {
    return http<UserView[]>("/users")
  },

  get: async (id: string): Promise<UserView> => {
    return http<UserView>(`/users/${id}`)
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
