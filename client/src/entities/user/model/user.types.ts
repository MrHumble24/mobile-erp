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
}

export interface UpdateUserDto {
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
    telegramHandle?: string
  }
  isActive?: boolean
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
