import { http } from "@/shared/api/http"
import type {
  CreateStoreDto,
  StoreView,
  UpdateStoreDto,
} from "../model/store.types"

export const storeRepository = {
  list: (includeDeactivated = false) =>
    http<StoreView[]>("/stores", { params: { includeDeactivated } }),
  get: (id: string) => http<StoreView>(`/stores/${id}`),
  create: (dto: CreateStoreDto) =>
    http<StoreView>("/stores", { method: "POST", body: dto }),
  update: (id: string, dto: UpdateStoreDto) =>
    http<StoreView>(`/stores/${id}`, { method: "PATCH", body: dto }),
  deactivate: (id: string) =>
    http<StoreView>(`/stores/${id}/deactivate`, { method: "POST" }),
}
