import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { settingsRepository } from "../api/settings.repository"
import { settingsKeys } from "../api/settings.keys"
import type { UpdateSettingsDto } from "./settings.types"

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => settingsRepository.get(),
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateSettingsDto) => settingsRepository.update(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })
}
