import type { UserListFilters } from "../model/user.types"

export const userKeys = {
  all: ["users"] as const,
  flat: () => [...userKeys.all, "flat"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserListFilters) => [...userKeys.lists(), filters] as const,
  stats: () => [...userKeys.all, "stats"] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  effective: (id: string) => [...userKeys.detail(id), "effective"] as const,
  roles: () => ["access", "roles"] as const,
  permissions: () => ["access", "permissions"] as const,
}
