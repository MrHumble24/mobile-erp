import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useExpenseCategories } from "@/entities/expense-category"
import { useCreateExpense } from "@/entities/expense"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

function ExpenseCategoryAndAmount({
  categoryId,
  setCategoryId,
  amount,
  setAmount,
}: {
  categoryId: string
  setCategoryId: (v: string) => void
  amount: string
  setAmount: (v: string) => void
}) {
  const { t } = useI18n()
  const { data: categories } = useExpenseCategories()

  return (
    <>
      <div className="space-y-1">
        <Label>{t("expenses.category")}</Label>
        <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
          <SelectTrigger className="h-10"><SelectValue placeholder={t("expenses.category")} /></SelectTrigger>
          <SelectContent>
            {categories?.filter((c) => c.isActive).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>{t("expenses.amount")}</Label>
        <Input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-10 font-mono font-bold"
          required
        />
      </div>
    </>
  )
}

function ExpenseDetailsAndRecurring({
  description,
  setDescription,
  incurredAt,
  setIncurredAt,
  isRecurring,
  setIsRecurring,
}: {
  description: string
  setDescription: (v: string) => void
  incurredAt: string
  setIncurredAt: (v: string) => void
  isRecurring: boolean
  setIsRecurring: (v: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-1">
        <Label>{t("expenses.incurredAt")}</Label>
        <Input
          type="date"
          value={incurredAt}
          onChange={(e) => setIncurredAt(e.target.value)}
          className="h-10"
          required
        />
      </div>

      <div className="space-y-1">
        <Label>{t("expenses.description")}</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ijara, tushlik, internet..."
          className="h-10"
        />
      </div>

      <div className="flex items-center justify-between py-2 border-t border-border">
        <Label htmlFor="recurring-switch" className="cursor-pointer">{t("expenses.isRecurring")}</Label>
        <Switch id="recurring-switch" checked={isRecurring} onCheckedChange={setIsRecurring} />
      </div>
    </>
  )
}

function LogExpenseForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const createMutation = useCreateExpense()
  const [categoryId, setCategoryId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [incurredAt, setIncurredAt] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [isRecurring, setIsRecurring] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !amount || Number(amount) <= 0) return

    const dto = {
      categoryId,
      amount: Number(amount),
      description: description.trim() || undefined,
      incurredAt: new Date(incurredAt).toISOString(),
      isRecurring,
    }

    createMutation.mutate(dto, {
      onSuccess: () => {
        toast.success(t("expenses.expenseSaved"))
        onCancel()
        onSuccess?.()
      },
      onError: (err: any) => toast.error(err?.message || t("common.error")),
    })
  }

  const detailsProps = { description, setDescription, incurredAt, setIncurredAt, isRecurring, setIsRecurring }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 my-2">
      <ExpenseCategoryAndAmount categoryId={categoryId} setCategoryId={setCategoryId} amount={amount} setAmount={setAmount} />
      <ExpenseDetailsAndRecurring {...detailsProps} />
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? t("common.loading") : t("expenses.newExpense")}
      </Button>
    </form>
  )
}

export function LogExpenseDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("expenses.newExpense")}</DialogTitle>
        </DialogHeader>
        {open && <LogExpenseForm onCancel={() => onOpenChange(false)} onSuccess={onSuccess} />}
      </DialogPopup>
    </Dialog>
  )
}
