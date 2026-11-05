import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { LedgerAccountBalance } from "@/entities/ledger"
import { LedgerEntryDialog, type LedgerEntryMode } from "@/features/record-ledger-entry"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

const ACTIONS: { mode: LedgerEntryMode; labelKey: string }[] = [
  { mode: "OPENING", labelKey: "balance.setOpening" },
  { mode: "DEPOSIT", labelKey: "balance.deposit" },
  { mode: "WITHDRAWAL", labelKey: "balance.withdraw" },
  { mode: "TRANSFER", labelKey: "balance.transfer" },
  { mode: "CORRECTION", labelKey: "balance.correction" },
]

export function BalanceActions({ accounts }: { accounts: LedgerAccountBalance[] }) {
  const { t } = useI18n()
  const [mode, setMode] = React.useState<LedgerEntryMode | null>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="sm" className="gap-1.5" disabled={accounts.length === 0} />}
        >
          <Plus className="size-4" />
          {t("balance.newEntry")}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ACTIONS.map((a) => (
            <DropdownMenuItem key={a.mode} onClick={() => setMode(a.mode)}>
              {t(a.labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <LedgerEntryDialog
        mode={mode}
        accounts={accounts}
        open={mode !== null}
        onOpenChange={(open) => !open && setMode(null)}
      />
    </>
  )
}
