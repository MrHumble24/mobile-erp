import * as React from "react"
import { Download, Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useCustomerList, type CustomerView } from "@/entities/customer"
import { CustomerFormDialog } from "@/features/manage-customer"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Pagination } from "@/shared/ui/pagination"
import { Skeleton } from "@/shared/ui/skeleton"
import { useCustomerFilters } from "../model/use-customer-filters"
import { exportCustomersCsv } from "../lib/customers-csv"
import { CustomerFilters } from "./CustomerFilters"
import { CustomerSummary } from "./CustomerSummary"
import { CustomerTable } from "./CustomerTable"
import { CustomerDetailSheet } from "./CustomerDetailSheet"

interface FormState {
  open: boolean
  customer: CustomerView | null
}

export function CustomersPage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("customer.manage"))
  const canAdjustBonus = useAuthStore((s) => s.hasPermission("bonus.adjust"))
  const filters = useCustomerFilters()
  const { data, isLoading } = useCustomerList(filters.queryFilters)

  const [form, setForm] = React.useState<FormState>({ open: false, customer: null })
  const [detailId, setDetailId] = React.useState<string | null>(null)

  const actions = React.useMemo(
    () => ({
      onOpenDetail: (customer: CustomerView) => setDetailId(customer.id),
      onEdit: (customer: CustomerView) => setForm({ open: true, customer }),
    }),
    []
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("customers.title")}
        description={t("customers.description")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!data || data.items.length === 0}
              onClick={() => data && exportCustomersCsv(data.items)}
            >
              <Download className="size-4" />
              {t("customers.exportCsv")}
            </Button>
            {canManage && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setForm({ open: true, customer: null })}
              >
                <Plus className="size-4" />
                {t("customers.newCustomer")}
              </Button>
            )}
          </div>
        }
      />

      <CustomerFilters filters={filters} />
      <CustomerSummary />

      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <CustomerTable
          customers={data?.items ?? []}
          canManage={canManage}
          actions={actions}
        />
      )}

      {data && data.total > 0 && (
        <Pagination
          page={filters.page}
          pageSize={filters.pageSize}
          total={data.total}
          rangeLabel={(from, to, total) => t("inventory.pageRange", { from, to, total })}
          perPageLabel={t("inventory.perPage")}
          onPageChange={filters.setPage}
          onPageSizeChange={filters.setPageSize}
        />
      )}

      <CustomerFormDialog
        customer={form.customer}
        open={form.open}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
      />

      <CustomerDetailSheet
        customerId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(customer) => setForm({ open: true, customer })}
        canAdjustBonus={canAdjustBonus}
      />
    </div>
  )
}
