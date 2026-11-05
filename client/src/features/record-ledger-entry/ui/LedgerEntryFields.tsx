import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { accountI18nKey, type LedgerAccountBalance } from "@/entities/ledger"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import type { LedgerEntryMode, LedgerEntryValues } from "../model/ledger-entry.schema"

type FormApi = UseFormReturn<LedgerEntryValues>
type AccountFieldName = "accountCode" | "fromAccountCode" | "toAccountCode"

function useAccountLabel() {
  const { t } = useI18n()
  return (account: LedgerAccountBalance) => {
    const key = accountI18nKey(account.accountCode)
    return key ? t(key) : account.label
  }
}

function AccountSelect({
  form,
  name,
  label,
  accounts,
}: {
  form: FormApi
  name: AccountFieldName
  label: string
  accounts: LedgerAccountBalance[]
}) {
  const labelFor = useAccountLabel()
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.accountCode} value={a.accountCode}>
                  {labelFor(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function TextField({
  form,
  name,
  label,
  type,
}: {
  form: FormApi
  name: "amount" | "occurredAt"
  label: string
  type: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} className="h-10" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function NoteField({ form, label }: { form: FormApi; label: string }) {
  return (
    <FormField
      control={form.control}
      name="note"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea className="min-h-[64px]" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function LedgerEntryFields({
  form,
  mode,
  accounts,
}: {
  form: FormApi
  mode: LedgerEntryMode
  accounts: LedgerAccountBalance[]
}) {
  const { t } = useI18n()
  const hint =
    mode === "OPENING" ? t("balance.openingHint") : mode === "CORRECTION" ? t("balance.correctionHint") : null
  return (
    <>
      {mode === "TRANSFER" ? (
        <>
          <AccountSelect form={form} name="fromAccountCode" label={t("balance.fromAccount")} accounts={accounts} />
          <AccountSelect form={form} name="toAccountCode" label={t("balance.toAccount")} accounts={accounts} />
        </>
      ) : (
        <AccountSelect form={form} name="accountCode" label={t("balance.filterAccount")} accounts={accounts} />
      )}
      <TextField form={form} name="amount" type="number" label={t("balance.amount")} />
      {hint && <p className="text-xs text-muted-foreground -mt-2">{hint}</p>}
      <TextField form={form} name="occurredAt" type="date" label={t("balance.date")} />
      <NoteField form={form} label={mode === "CORRECTION" ? t("balance.reason") : t("balance.note")} />
    </>
  )
}
