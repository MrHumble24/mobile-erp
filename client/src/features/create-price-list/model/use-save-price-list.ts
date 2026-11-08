import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useI18n } from "@/shared/i18n"
import { deviceModelKeys, deviceModelRepository } from "@/entities/device-model"
import { customsKeys, useCreatePriceList } from "@/entities/customs"
import { toast } from "@/shared/ui/sonner"
import {
  toCreateDto,
  type CreatePriceListValues,
} from "./create-price-list.schema"
import type { ModelLinkAssignment } from "./model-match"

/** The full save sequence: create the list version, then write each model's linked code. */
export function usePriceListSubmit(onSaved: () => void) {
  const { t } = useI18n()
  const createMutation = useCreatePriceList()
  const queryClient = useQueryClient()
  const [linking, setLinking] = useState(false)

  const submit = (values: CreatePriceListValues, assignments: ModelLinkAssignment[]) => {
    createMutation.mutate(toCreateDto(values), {
      onSuccess: async () => {
        setLinking(true)
        try {
          const { linked, failed } = await applyModelLinks(assignments, queryClient)
          queryClient.invalidateQueries({ queryKey: customsKeys.all })
          if (linked > 0) toast.success(t("customs.listSavedWithLinks", { count: linked }))
          if (linked === 0 && failed === 0) toast.success(t("customs.listSaved"))
          if (failed > 0) toast.warning(t("customs.linkFailed", { count: failed }))
          onSaved()
        } finally {
          setLinking(false)
        }
      },
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    })
  }

  // The save button stays disabled through the model PATCHes too — a second
  // click during linking would create a duplicate version of the price list.
  return { submit, isPending: createMutation.isPending || linking }
}

/** PATCH each model's customsCode after the list exists; the server stays authoritative at intake. */
async function applyModelLinks(
  assignments: { modelId: string; customsCode: string }[],
  queryClient: ReturnType<typeof useQueryClient>
): Promise<{ linked: number; failed: number }> {
  if (assignments.length === 0) return { linked: 0, failed: 0 }
  const results = await Promise.allSettled(
    assignments.map((a) => deviceModelRepository.update(a.modelId, { customsCode: a.customsCode }))
  )
  const linked = results.filter((r) => r.status === "fulfilled").length
  queryClient.invalidateQueries({ queryKey: deviceModelKeys.lists() })
  return { linked, failed: results.length - linked }
}
