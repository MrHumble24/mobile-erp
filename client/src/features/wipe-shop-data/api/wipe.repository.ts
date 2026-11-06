import { http } from "@/shared/api/http"
import type {
  WipePreview,
  WipeRequestDto,
  WipeRunView,
  WipeStatusView,
} from "../model/wipe.types"

/** The only place that talks to `/data-wipe`. Returns server views as-is. */
export const wipeRepository = {
  preview: () => http<WipePreview>("/data-wipe/preview"),
  status: () => http<WipeStatusView>("/data-wipe/status"),
  runs: () => http<WipeRunView[]>("/data-wipe/runs"),
  erase: (dto: WipeRequestDto) =>
    http<{ ok: true }>("/data-wipe", { method: "POST", body: dto }),
}
