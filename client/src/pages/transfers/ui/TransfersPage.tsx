import * as React from "react"
import { ArrowLeftRight, Eye, Plus } from "lucide-react"
import {
  StockTransferStatusBadge,
  useStockTransfers,
  type StockTransferView,
} from "@/entities/stock-transfer"
import { useAuthStore } from "@/features/auth"
import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { PageHeader } from "@/shared/ui/page-header"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { CreateTransferDialog } from "./CreateTransferDialog"
import { TransferDetailSheet } from "./TransferDetailSheet"

export function TransfersPage() {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "SENT" | "RECEIVED" | "CANCELLED"
  >("ALL")
  const { data, isLoading } = useStockTransfers({
    status: statusFilter === "ALL" ? undefined : statusFilter,
  })
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedTransfer, setSelectedTransfer] =
    React.useState<StockTransferView | null>(null)

  const items = data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("transfers.title")}
        description={t("transfers.subtitle")}
        actions={
          hasPermission("transfer.create") ? (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              <span>{t("transfers.newTransfer")}</span>
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-2">
        {(["ALL", "SENT", "RECEIVED", "CANCELLED"] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="text-xs"
          >
            {s === "ALL" ? t("common.all") : t(`transfers.filter${s}`)}
          </Button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <ArrowLeftRight className="size-10 mb-3 opacity-30" />
            <p className="text-sm">{t("transfers.noTransfers")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("transfers.number")}</TableHead>
                <TableHead>{t("transfers.from")}</TableHead>
                <TableHead>{t("transfers.to")}</TableHead>
                <TableHead>{t("transfers.itemsCount")}</TableHead>
                <TableHead>{t("transfers.status")}</TableHead>
                <TableHead>{t("transfers.sentAt")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {transfer.transferNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    {transfer.sourceStore.name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {transfer.targetStore.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {transfer.lines.length} ta
                  </TableCell>
                  <TableCell>
                    <StockTransferStatusBadge status={transfer.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(transfer.sentAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8"
                      onClick={() => setSelectedTransfer(transfer)}
                      title={t("common.view")}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateTransferDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <TransferDetailSheet
        transfer={selectedTransfer}
        open={Boolean(selectedTransfer)}
        onClose={() => setSelectedTransfer(null)}
      />
    </div>
  )
}
