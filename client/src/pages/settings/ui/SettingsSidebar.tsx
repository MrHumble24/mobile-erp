import { useI18n } from "@/shared/i18n"
import { Search, X, ChevronRight } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import {
  SETTINGS_GROUPS,
  SETTINGS_CATEGORIES,
  type SettingsCategory,
} from "../model/settings-categories"

export interface SettingsSidebarProps {
  selected: SettingsCategory
  onSelect: (id: SettingsCategory) => void
  search: string
  onSearchChange: (query: string) => void
  dirtyMap?: Partial<Record<SettingsCategory, boolean>>
  className?: string
}

export function SettingsSidebar({
  selected,
  onSelect,
  search,
  onSearchChange,
  dirtyMap = {},
  className,
}: SettingsSidebarProps) {
  const { t } = useI18n()
  const q = search.trim().toLowerCase()

  const filteredCategories = SETTINGS_CATEGORIES.filter((cat) => {
    if (!q) return true
    const title = t(cat.titleKey).toLowerCase()
    const desc = t(cat.descKey).toLowerCase()
    return (
      title.includes(q) ||
      desc.includes(q) ||
      cat.keywords.some((kw) => kw.toLowerCase().includes(q))
    )
  })

  return (
    <aside
      className={cn(
        "w-full md:w-64 shrink-0 flex flex-col gap-3",
        className,
      )}
    >
      {/* Search Input (Minimalist macOS / Linear style) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("settings.searchSettings")}
          className="h-8 pl-8 pr-7 text-xs rounded-lg bg-card/80 border-border/70 shadow-2xs focus-visible:ring-1"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground rounded-lg bg-card/60 border border-border/60">
            {t("settings.noMatchingSettings")}
          </div>
        ) : (
          SETTINGS_GROUPS.map((group) => {
            const items = filteredCategories.filter((c) => c.group === group.key)
            if (items.length === 0) return null

            return (
              <div key={group.key} className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase select-none">
                  {t(group.labelKey)}
                </div>
                <div className="space-y-0.5">
                  {items.map((cat) => {
                    const isSelected = selected === cat.id
                    const isDirty = dirtyMap[cat.id]
                    const Icon = cat.icon

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelect(cat.id)}
                        className={cn(
                          "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors group",
                          isSelected
                            ? "bg-accent text-accent-foreground font-semibold shadow-2xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              isSelected
                                ? "text-foreground"
                                : "text-muted-foreground/80 group-hover:text-foreground",
                            )}
                            strokeWidth={1.75}
                          />
                          <span className="truncate">{t(cat.titleKey)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isDirty && (
                            <span
                              className="size-1.5 rounded-full bg-primary"
                              title={t("settings.unsaved")}
                            />
                          )}
                          <ChevronRight
                            className={cn(
                              "size-3.5 opacity-30 transition-transform group-hover:translate-x-0.5 md:hidden",
                              isSelected ? "opacity-80" : "",
                            )}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </nav>
    </aside>
  )
}
