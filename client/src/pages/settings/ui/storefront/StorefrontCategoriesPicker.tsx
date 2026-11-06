import { useI18n } from "@/shared/i18n"
import { useProductCategories } from "@/entities/product-category"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"

interface StorefrontCategoriesPickerProps {
  selectedCategoryIds: string[]
  onToggleCategory: (categoryId: string) => void
  disabled: boolean
}

export function StorefrontCategoriesPicker({
  selectedCategoryIds,
  onToggleCategory,
  disabled,
}: StorefrontCategoriesPickerProps) {
  const { t } = useI18n()
  const { data: categories } = useProductCategories()

  if (!categories || categories.length === 0) return null

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <Label className="text-xs font-semibold">
        {t("settings.storefrontCategories")}
      </Label>
      <p className="text-[11px] text-muted-foreground">
        {selectedCategoryIds.length === 0
          ? t("settings.storefrontCategoriesAll")
          : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = selectedCategoryIds.includes(cat.id)
          return (
            <Button
              key={cat.id}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "outline"}
              disabled={disabled}
              onClick={() => onToggleCategory(cat.id)}
              className="h-8 rounded-full text-xs font-semibold"
            >
              {cat.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
