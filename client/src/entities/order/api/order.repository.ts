import { http } from "@/shared/api/http"
import type {
  StorefrontOrderView,
  StorefrontOrderDetailView,
  StorefrontOrderStats,
  StorefrontOrderPage,
  ListOrdersQuery,
  UpdateOrderStatusDto,
  HandOverOrderDto,
} from "./order.types"

export const orderRepository = {
  list: (params?: ListOrdersQuery) =>
    http<StorefrontOrderPage>("/storefront-orders", { params }),

  getStats: () =>
    http<StorefrontOrderStats>("/storefront-orders/stats"),

  getById: (id: string) =>
    http<StorefrontOrderDetailView>(`/storefront-orders/${id}`),

  updateStatus: (id: string, dto: UpdateOrderStatusDto) =>
    http<StorefrontOrderView>(`/storefront-orders/${id}/status`, {
      method: "PATCH",
      body: dto,
    }),

  hold: (id: string, dto?: { deviceId?: string }) =>
    http<StorefrontOrderDetailView>(`/storefront-orders/${id}/hold`, {
      method: "POST",
      body: dto ?? {},
    }),

  handOver: (id: string, dto: HandOverOrderDto) =>
    http<StorefrontOrderDetailView>(`/storefront-orders/${id}/hand-over`, {
      method: "POST",
      body: dto,
    }),
}
