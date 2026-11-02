import { Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Combobox } from "@/shared/ui/combobox"
import type { AttributeDef } from "../model/device-model.types"

export interface SpecFieldProblem {
  key: string
  message: string
}

interface DynamicSpecFieldsProps<T extends FieldValues> {
  attributes: AttributeDef[]
  control: Control<T>
  /** RHF field name holding the specs object, e.g. "specs". */
  name: Path<T>
  problems?: SpecFieldProblem[]
}

function sortByOrder(attributes: AttributeDef[]): AttributeDef[] {
  return [...attributes].sort((a, b) => a.sortOrder - b.sortOrder)
}

function SpecField({
  attr,
  value,
  onChange,
  problem,
}: {
  attr: AttributeDef
  value: string
  onChange: (value: string) => void
  problem?: string
}) {
  return (
    <div className="space-y-1">
      <Label>
        {attr.label}
        {attr.required && <span className="text-destructive"> *</span>}
      </Label>
      {attr.type === "select" ? (
        <Combobox
          value={value}
          onChange={onChange}
          options={attr.options.map((o) => ({ value: o, label: o }))}
          placeholder=""
        />
      ) : (
        <Input
          type={attr.type === "number" ? "number" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10"
        />
      )}
      {problem && <p className="text-xs text-destructive">{problem}</p>}
    </div>
  )
}

/** Renders one input per model attribute (sorted), bound to a `specs` object field. */
export function DynamicSpecFields<T extends FieldValues>({
  attributes,
  control,
  name,
  problems,
}: DynamicSpecFieldsProps<T>) {
  const byKey = new Map((problems ?? []).map((p) => [p.key, p.message]))
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const specs = (field.value ?? {}) as Record<string, string>
        return (
          <div className="grid grid-cols-2 gap-3">
            {sortByOrder(attributes).map((attr) => (
              <SpecField
                key={attr.key}
                attr={attr}
                value={specs[attr.key] ?? ""}
                onChange={(v) => field.onChange({ ...specs, [attr.key]: v })}
                problem={byKey.get(attr.key)}
              />
            ))}
          </div>
        )
      }}
    />
  )
}
