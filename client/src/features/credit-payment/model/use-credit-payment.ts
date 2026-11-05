import { useMutation, useQueryClient } from "@tanstack/react-query"
import { creditRepository, creditKeys, type CreditPaymentDto } from "@/entities/credit"
import { customerKeys } from "@/entities/customer"
import { ledgerKeys } from "@/entities/ledger"

interface CreditPaymentArgs {
  id: string
  dto: CreditPaymentDto
}

function useCreditMoneyMutation(
  fn: (id: string, dto: CreditPaymentDto) => ReturnType<typeof creditRepository.addPayment>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: CreditPaymentArgs) => fn(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditKeys.all })
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      queryClient.invalidateQueries({ queryKey: ledgerKeys.all })
    },
  })
}

/** Take a later payment on a credit (`sale.create`); rejected above outstanding. */
export function useAddCreditPayment() {
  return useCreditMoneyMutation((id, dto) => creditRepository.addPayment(id, dto))
}

/** Pay back an overpayment after a return (`sale.return`); capped at overpaid. */
export function useRefundOverpayment() {
  return useCreditMoneyMutation((id, dto) => creditRepository.refund(id, dto))
}
