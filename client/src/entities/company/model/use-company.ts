import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { companyRepository } from "../api/company.repository"
import type {
  CompanyProfileView,
  UpdateCompanyProfileDto,
  ThemeView,
  SetupDto,
} from "../types/company.types"

export function useCompanyProfile() {
  return useQuery<CompanyProfileView>({
    queryKey: ["company", "profile"],
    queryFn: () => companyRepository.getProfile(),
  })
}

export function useThemes() {
  return useQuery<ThemeView[]>({
    queryKey: ["themes"],
    queryFn: () => companyRepository.listThemes(),
    staleTime: 60 * 60 * 1000,
  })
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateCompanyProfileDto) => companyRepository.updateProfile(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", "profile"] })
      queryClient.invalidateQueries({ queryKey: ["branding"] })
    },
  })
}

export function useUploadLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => companyRepository.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", "profile"] })
      queryClient.invalidateQueries({ queryKey: ["branding"] })
    },
  })
}

export function useTelegramStatus() {
  return useQuery({
    queryKey: ["settings", "telegram"],
    queryFn: () => companyRepository.getTelegramStatus(),
  })
}

export function useUpdateTelegramToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => companyRepository.updateTelegramToken(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "telegram"] })
    },
  })
}

export function useTestTelegram() {
  return useMutation({
    mutationFn: () => companyRepository.testTelegram(),
  })
}

export function usePerformSetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: SetupDto) => companyRepository.performSetup(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setup", "status"] })
      queryClient.invalidateQueries({ queryKey: ["branding"] })
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
    },
  })
}
