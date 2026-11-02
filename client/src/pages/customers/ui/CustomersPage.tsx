import * as React from "react"
import { Plus, Search, User, History } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useCustomers, type CustomerView } from "@/entities/customer"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { CreateCustomerDialog } from "./CreateCustomerDialog"
import { CustomerDetailsDrawer } from "./CustomerDetailsDrawer"

function CustomerTableRow({
  customer,
  onSelect,
}: {
  customer: CustomerView
  onSelect: (customer: CustomerView) => void
}) {
  const { t } = useI18n()

  return (
    <TableRow>
      <TableCell className="font-semibold text-sm">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span>{customer.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm font-mono text-muted-foreground">
        {customer.phone || "—"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {customer.notes || "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(customer.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs rounded-full"
          onClick={() => onSelect(customer)}
        >
          <History className="size-3.5" />
          {t("sales.customerSalesHistory")}
        </Button>
      </TableCell>
    </TableRow>
  )
}

function CustomersListTable({
  customers,
  onSelect,
}: {
  customers: CustomerView[]
  onSelect: (customer: CustomerView) => void
}) {
  const { t } = useI18n()
  if (customers.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-[#e8e8e8] rounded-[12px] bg-white">
        {t("sales.noCustomersFound")}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[12px] border border-[#e8e8e8] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>{t("common.phone")}</TableHead>
            <TableHead>{t("common.notes")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <CustomerTableRow key={c.id} customer={c} onSelect={onSelect} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function CustomersPage() {
  const { t } = useI18n()
  const [search, setSearch] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerView | null>(null)

  const { data: customers, isLoading } = useCustomers(search || undefined)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("sales.customersTitle")}
        description="Do'kon mijozlari bazasi, aloqa ma'lumotlari va shaxsiy savdolar tarixi"
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-9 px-4 rounded-full text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="size-4" />
            {t("sales.newCustomer")}
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="pl-9 h-9 rounded-[9px]"
        />
      </div>

      {isLoading && (
        <div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      )}

      {customers && (
        <CustomersListTable customers={customers} onSelect={setSelectedCustomer} />
      )}

      <CreateCustomerDialog open={createOpen} onOpenChange={setCreateOpen} />

      <CustomerDetailsDrawer
        customer={selectedCustomer}
        open={Boolean(selectedCustomer)}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      />
    </div>
  )
}
