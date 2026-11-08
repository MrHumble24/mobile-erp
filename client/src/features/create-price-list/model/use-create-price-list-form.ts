import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthStore } from "@/features/auth"
import { useDeviceModels, type DeviceModelView } from "@/entities/device-model"
import type { CurrentPriceList } from "@/entities/customs"
import {
  createPriceListSchema,
  initialValues,
  type CreatePriceListValues,
} from "./create-price-list.schema"
import { useModelLinks } from "./use-model-links"
import { usePriceListSubmit } from "./use-save-price-list"

/** All state the create-list page form needs; the component only lays it out. */
export function useCreatePriceListForm(current: CurrentPriceList | null, onSaved: () => void) {
  const canLink = useAuthStore((s) => s.hasPermission("device.update"))
  const modelsQuery = useDeviceModels()
  const models: DeviceModelView[] = modelsQuery.data ?? []
  const form = useForm<CreatePriceListValues>({
    resolver: zodResolver(createPriceListSchema),
    defaultValues: initialValues(current),
  })
  const items = (useWatch({ control: form.control, name: "items" }) ?? []) as CreatePriceListValues["items"]
  const links = useModelLinks(items, models, canLink)
  const { submit, isPending } = usePriceListSubmit(onSaved)
  return { canLink, modelsQuery, models, form, items, links, submit, isPending }
}
