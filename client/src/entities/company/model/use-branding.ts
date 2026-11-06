import { useQuery } from "@tanstack/react-query"
import { companyRepository } from "../api/company.repository"
import type { BrandingView } from "../types/company.types"

export function useBranding() {
  return useQuery<BrandingView>({
    queryKey: ["branding"],
    queryFn: () => companyRepository.getBranding(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSetupStatus() {
  return useQuery<{ needsSetup: boolean }>({
    queryKey: ["setup", "status"],
    queryFn: () => companyRepository.getSetupStatus(),
    staleTime: 30 * 1000,
  })
}
