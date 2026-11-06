import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Check, ChevronDown, Store } from "lucide-react"
import { useAuthStore } from "@/features/auth"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { switchActiveStore, useStoreSelectionStore } from "../model/store.store"

export function StorePicker() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const stores = user?.stores ?? []
  const currentStoreId = useStoreSelectionStore((s) => s.currentStoreId)
  const setStoreId = useStoreSelectionStore((s) => s.setStoreId)

  React.useEffect(() => {
    if (stores.length === 0) return
    const ids = stores.map((s) => s.id)
    if (!currentStoreId || !ids.includes(currentStoreId)) {
      setStoreId(stores[0].id)
    }
  }, [stores, currentStoreId, setStoreId])

  if (stores.length <= 1) {
    return null
  }

  const activeStore = stores.find((s) => s.id === currentStoreId) ?? stores[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-2 rounded-full font-medium"
          />
        }
      >
        <Store className="size-4 text-muted-foreground shrink-0" />
        <span className="max-w-[130px] truncate">{activeStore?.name ?? "..."}</span>
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {stores.map((s) => {
          const isSelected = s.id === activeStore?.id
          return (
            <DropdownMenuItem
              key={s.id}
              className="flex items-center justify-between gap-3 cursor-pointer"
              onClick={() => {
                if (s.id !== activeStore?.id) {
                  void switchActiveStore(s.id, qc)
                }
              }}
            >
              <span>{s.name}</span>
              {isSelected && <Check className="size-4 text-emerald-600 shrink-0" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
