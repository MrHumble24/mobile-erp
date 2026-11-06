export interface UserProfileData {
  firstName: string
  lastName?: string | null
  phone?: string | null
  telegramHandle?: string | null
  avatarUrl?: string | null
  locale?: string | null
}

export interface UserView {
  id: string
  email: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  profile: UserProfileData | null
  roles: string[]
  stores?: { id: string; name: string }[]
}

export interface CreateUserDto {
  email: string
  password: string
  profile: {
    firstName: string
    lastName?: string
    phone?: string
    telegramHandle?: string
  }
  roleCodes: string[]
  storeIds?: string[]
}

export interface UpdateUserDto {
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
    telegramHandle?: string
    locale?: string
  }
  isActive?: boolean
  storeIds?: string[]
}

export interface UserListFilters {
  search?: string
  role?: string
  active?: boolean
  page: number
  pageSize: number
}

export interface PaginatedUsers {
  items: UserView[]
  total: number
  page: number
  pageSize: number
}

export interface UserStats {
  total: number
  active: number
  byRole: Record<string, number>
}

export interface RoleGrant {
  permissionCode: string
  roleCodes: string[]
}

export interface UserPermissionBreakdown {
  roles: string[]
  roleGrants: RoleGrant[]
  overrides: Array<{ permissionCode: string; granted: boolean; reason: string | null }>
  effective: string[]
}

export interface ResetPasswordDto {
  password: string
}

export interface UpdateRoleDto {
  name?: string
  description?: string
}

export interface SetRolesDto {
  roleCodes: string[]
}

export interface PermissionOverride {
  permissionCode: string
  granted: boolean
  reason?: string
}

export interface SetPermissionsDto {
  overrides: PermissionOverride[]
}

export interface RoleView {
  code: string
  name: string
  description: string | null
  isSystem: boolean
  permissionCodes: string[]
}

export interface CreateRoleDto {
  code: string
  name: string
  description?: string
}

export interface PermissionView {
  code: string
  resource: string
  action: string
  description: string | null
}
