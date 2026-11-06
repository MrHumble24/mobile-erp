import { http } from "@/shared/api/http"
import type {
  OnlinePaymentProviderConfig,
  UpdateProviderConfigDto,
} from "./online-payment.types"

export const onlinePaymentRepository = {
  listProviders: () =>
    http<OnlinePaymentProviderConfig[]>("/online-payments/providers"),

  getProvider: (code: string) =>
    http<OnlinePaymentProviderConfig>(`/online-payments/providers/${code}`),

  updateProvider: (code: string, dto: UpdateProviderConfigDto) =>
    http<OnlinePaymentProviderConfig>(`/online-payments/providers/${code}`, {
      method: "PUT",
      body: dto,
    }),

  setSecret: (code: string, secret: string) =>
    http<{ ok: boolean }>(`/online-payments/providers/${code}/secret`, {
      method: "POST",
      body: { secret },
    }),

  checkProvider: (code: string) =>
    http<{ ok: boolean; message: string }>(
      `/online-payments/providers/${code}/check`,
      {
        method: "POST",
      },
    ),

  refundPayment: (paymentId: string, reason?: string) =>
    http<unknown>(`/online-payments/${paymentId}/refund`, {
      method: "POST",
      body: { reason },
    }),
}
