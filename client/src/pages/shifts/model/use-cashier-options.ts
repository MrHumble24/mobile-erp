import { useQuery } from "@tanstack/react-query"
import { userRepository, userKeys } from "@/entities/user"
import type { CashierOption } from "../ui/ShiftsFilters"

/** Cashier picker options for the shifts filter. Fetched only for `shift.manage`
 *  (the users endpoint needs that reach); reuses the users list cache. */
export function useCashierOptions(enabled: boolean): CashierOption[] {
  const { data } = useQuery({
    queryKey: userKeys.flat(),
    queryFn: () => userRepository.list(),
    enabled,
  })
  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.profile ? `${u.profile.firstName} ${u.profile.lastName ?? ""}`.trim() : u.email,
  }))
}
