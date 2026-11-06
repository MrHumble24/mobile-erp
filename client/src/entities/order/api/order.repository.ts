import { http } from "@/shared/api/http"
import type {
  StorefrontOrderView,
  StorefrontOrderDetailView,
  StorefrontOrderStats,
  StorefrontOrderPage,
  ListOrdersQuery,
  UpdateOrderStatusDto,
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
}
