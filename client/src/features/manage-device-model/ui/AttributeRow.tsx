import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import {
  RESERVED_STORAGE_KEY,
  slugKey,
  type DeviceModelFormValues,
} from "../model/device-model-form.schema"
import { OptionsChipsEditor } from "./OptionsChipsEditor"

type Form = UseFormReturn<DeviceModelFormValues>

interface RowProps {
  form: Form
  index: number
  keyEditable: boolean
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

function LabelField({ form, index, locked, keyEditable }: {
  form: Form
  index: number
  locked: boolean
  keyEditable: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label className="text-xs">{t("inventory.attrLabel")}</Label>
      <Controller
        control={form.control}
        name={`attributes.${index}.label`}
        render={({ field }) => (
          <Input
            className="h-9"
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value)
              // Auto-derive the key from the label until the model is saved.
              if (keyEditable && !locked) {
                form.setValue(`attributes.${index}.key`, slugKey(e.target.value))
              }
            }}
          />
        )}
      />
    </div>
  )
}

function KeyField({ form, index, disabled }: { form: Form; index: number; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label className="text-xs">{t("inventory.attrKey")}</Label>
      <Controller
        control={form.control}
        name={`attributes.${index}.key`}
        render={({ field, fieldState }) => (
          <>
            <Input className="h-9 font-mono text-xs" value={field.value} disabled={disabled} onChange={field.onChange} />
            {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
          </>
        )}
      />
    </div>
  )
}

function TypeField({ form, index, locked }: { form: Form; index: number; locked: boolean }) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label className="text-xs">{t("inventory.attrType")}</Label>
      <Controller
        control={form.control}
        name={`attributes.${index}.type`}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange} disabled={locked}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">{t("inventory.attrTypeText")}</SelectItem>
              <SelectItem value="number">{t("inventory.attrTypeNumber")}</SelectItem>
              <SelectItem value="select">{t("inventory.attrTypeSelect")}</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  )
}

function RowButtons({ locked, isFirst, isLast, onMoveUp, onMoveDown, onRemove }: Omit<RowProps, "form" | "index" | "keyEditable"> & { locked: boolean }) {
  return (
    <div className="ml-auto flex gap-1 pb-1">
      <Button type="button" variant="ghost" size="icon" className="size-8" disabled={isFirst} onClick={onMoveUp}>
        <ChevronUp className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8" disabled={isLast} onClick={onMoveDown}>
        <ChevronDown className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" disabled={locked} onClick={onRemove}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

function RequiredField({ form, index }: { form: Form; index: number }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-1.5 pb-2">
      <Label className="text-xs">{t("inventory.attrRequired")}</Label>
      <Controller
        control={form.control}
        name={`attributes.${index}.required`}
        render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
      />
    </div>
  )
}

function OptionsField({ form, index }: { form: Form; index: number }) {
  const { t } = useI18n()
  return (
    <div className="space-y-1">
      <Label className="text-xs">{t("inventory.attrOptions")}</Label>
      <Controller
        control={form.control}
        name={`attributes.${index}.options`}
        render={({ field }) => <OptionsChipsEditor value={field.value} onChange={field.onChange} />}
      />
    </div>
  )
}

export function AttributeRow({ form, index, keyEditable, isFirst, isLast, onMoveUp, onMoveDown, onRemove }: RowProps) {
  const type = useWatch({ control: form.control, name: `attributes.${index}.type` })
  const key = useWatch({ control: form.control, name: `attributes.${index}.key` })
  const locked = key === RESERVED_STORAGE_KEY
  return (
    <div className="space-y-2 rounded-lg border p-3 bg-card">
      <div className="grid grid-cols-2 gap-2">
        <LabelField form={form} index={index} locked={locked} keyEditable={keyEditable} />
        <KeyField form={form} index={index} disabled={locked || !keyEditable} />
      </div>
      <div className="flex items-end gap-2">
        <TypeField form={form} index={index} locked={locked} />
        <RequiredField form={form} index={index} />
        <RowButtons
          locked={locked}
          isFirst={isFirst}
          isLast={isLast}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
        />
      </div>
      {type === "select" && <OptionsField form={form} index={index} />}
    </div>
  )
}
