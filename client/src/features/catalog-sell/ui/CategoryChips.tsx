import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { useProductCategories } from "@/entities/product-category"

export interface CategoryChipsProps {
  value: string | undefined
  onChange: (categoryId: string | undefined) => void
}

/** Horizontal category filter chips: "All products" plus each active category. */
export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  const { t } = useI18n()
  const { data: categories } = useProductCategories()
  const active = (categories ?? []).filter((c) => c.isActive || c.id === value)

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Chip selected={!value} onClick={() => onChange(undefined)} label={t("catalog.allProducts")} />
      {active.map((c) => (
        <Chip key={c.id} selected={value === c.id} onClick={() => onChange(c.id)} label={c.name} />
      ))}
    </div>
  )
}

function Chip({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      onClick={onClick}
      className="shrink-0"
    >
      {label}
    </Button>
  )
}
