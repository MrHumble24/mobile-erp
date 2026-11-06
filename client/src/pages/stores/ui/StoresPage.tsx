import * as React from "react"
import { Edit2, Plus, PowerOff, Store as StoreIcon } from "lucide-react"
import {
  useDeactivateStore,
  useStores,
  type StoreView,
} from "@/entities/store"
import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { PageHeader } from "@/shared/ui/page-header"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { CreateStoreDialog } from "./CreateStoreDialog"
import { EditStoreDialog } from "./EditStoreDialog"

export function StoresPage() {
  const { t } = useI18n()
  const { data: stores, isLoading } = useStores(true)
  const deactivateMutation = useDeactivateStore()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingStore, setEditingStore] = React.useState<StoreView | null>(null)

  const handleDeactivate = (store: StoreView) => {
    if (!window.confirm(t("stores.confirmDeactivate", { name: store.name }))) {
      return
    }
    deactivateMutation.mutate(store.id, {
      onSuccess: () => {
        toast.success(t("stores.deactivated"))
      },
      onError: (err: { message?: string; data?: { message?: string } }) => {
        const msg = err.data?.message || err.message || t("common.error")
        toast.error(msg)
      },
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("stores.title")}
        description={t("stores.subtitle")}
        actions={
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            <span>{t("stores.newStore")}</span>
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !stores || stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <StoreIcon className="size-10 mb-3 opacity-30" />
            <p className="text-sm">{t("stores.noStores")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("stores.storeName")}</TableHead>
                <TableHead>{t("stores.address")}</TableHead>
                <TableHead>{t("stores.phone")}</TableHead>
                <TableHead>{t("stores.status")}</TableHead>
                <TableHead>{t("common.created")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((s) => {
                const isDeactivated = Boolean(s.deactivatedAt)
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-sm">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.address || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isDeactivated ? "mercury" : "mint"}>
                        {isDeactivated
                          ? t("stores.statusInactive")
                          : t("stores.statusActive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(s.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8"
                          onClick={() => setEditingStore(s)}
                          title={t("common.edit")}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        {!isDeactivated && (
                          <Button
                            size="icon"
                            variant="destructive"
                            className="size-8"
                            onClick={() => handleDeactivate(s)}
                            disabled={deactivateMutation.isPending}
                            title={t("stores.deactivate")}
                          >
                            <PowerOff className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateStoreDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <EditStoreDialog
        store={editingStore}
        open={Boolean(editingStore)}
        onOpenChange={(v) => !v && setEditingStore(null)}
      />
    </div>
  )
}
