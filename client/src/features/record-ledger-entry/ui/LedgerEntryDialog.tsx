import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateLedgerEntry,
  useLedgerTransfer,
  type LedgerAccountBalance,
} from "@/entities/ledger"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  defaultValues,
  makeLedgerEntrySchema,
  toCreateDto,
  toTransferDto,
  type LedgerEntryMode,
  type LedgerEntryValues,
} from "../model/ledger-entry.schema"
import { LedgerEntryFields } from "./LedgerEntryFields"

const TITLE_KEY: Record<LedgerEntryMode, string> = {
  OPENING: "balance.setOpening",
  DEPOSIT: "balance.deposit",
  WITHDRAWAL: "balance.withdraw",
  CORRECTION: "balance.correction",
  TRANSFER: "balance.transfer",
}

function useEntrySubmit(mode: LedgerEntryMode, onDone: () => void) {
  const { t } = useI18n()
  const createMutation = useCreateLedgerEntry()
  const transferMutation = useLedgerTransfer()

  const opts = (successKey: string) => ({
    onSuccess: () => {
      toast.success(t(successKey))
      onDone()
    },
    onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
  })

  const submit = (values: LedgerEntryValues) => {
    if (mode === "TRANSFER") {
      transferMutation.mutate(toTransferDto(values), opts("balance.transferSaved"))
    } else {
      createMutation.mutate(toCreateDto(mode, values), opts("balance.entrySaved"))
    }
  }

  return { submit, isPending: createMutation.isPending || transferMutation.isPending }
}

function LedgerEntryForm({
  mode,
  accounts,
  onDone,
}: {
  mode: LedgerEntryMode
  accounts: LedgerAccountBalance[]
  onDone: () => void
}) {
  const { t } = useI18n()
  const form = useForm<LedgerEntryValues>({
    resolver: zodResolver(makeLedgerEntrySchema(mode, t)),
    defaultValues: defaultValues(mode, accounts),
  })
  const { submit, isPending } = useEntrySubmit(mode, onDone)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4 my-2">
        <LedgerEntryFields form={form} mode={mode} accounts={accounts} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function LedgerEntryDialog({
  mode,
  accounts,
  open,
  onOpenChange,
}: {
  mode: LedgerEntryMode | null
  accounts: LedgerAccountBalance[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode ? t(TITLE_KEY[mode]) : t("balance.newEntry")}</DialogTitle>
        </DialogHeader>
        {open && mode && (
          <LedgerEntryForm key={mode} mode={mode} accounts={accounts} onDone={() => onOpenChange(false)} />
        )}
      </DialogPopup>
    </Dialog>
  )
}
