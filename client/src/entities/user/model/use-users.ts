import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { userRepository } from "../api/user.repository"
import { userKeys } from "../api/user.keys"
import type {
  CreateRoleDto,
  CreateUserDto,
  SetPermissionsDto,
  SetRolesDto,
  UpdateUserDto,
} from "./user.types"

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => userRepository.list(),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userRepository.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUserDto) => userRepository.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      userRepository.update(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

export function useSetUserRoles() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SetRolesDto }) =>
      userRepository.setRoles(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

export function useSetUserPermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SetPermissionsDto }) =>
      userRepository.setPermissions(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

export function useRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: () => userRepository.listRoles(),
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: userKeys.permissions(),
    queryFn: () => userRepository.listPermissions(),
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRoleDto) => userRepository.createRole(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.roles() })
    },
  })
}

export function useSetRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      code,
      permissionCodes,
    }: {
      code: string
      permissionCodes: string[]
    }) => userRepository.setRolePermissions(code, permissionCodes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.roles() })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => userRepository.deleteRole(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.roles() })
    },
  })
}
