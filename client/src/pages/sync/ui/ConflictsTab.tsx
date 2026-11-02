import { toast } from "@/shared/ui/sonner"
import { HttpError } from "@/shared/api/http"
import { useI18n } from "@/shared/i18n"
import { useConflicts, useResolveConflict, type ConflictView } from "@/entities/sync"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table"

type T = (k: string, p?: Record<string, string | number>) => string

function ConflictRow({ conflict, t }: { conflict: ConflictView; t: T }) {
  const resolve = useResolveConflict()

  const run = (resolution: "keep-server" | "apply-terminal") => {
    resolve.mutate(
      { id: conflict.id, dto: { resolution } },
      {
        onSuccess: () => toast.success(t("sync.resolved")),
        onError: (err) => {
          const reason = err instanceof HttpError ? err.message : t("common.error")
          toast.error(t("sync.resolveFailed", { reason }))
        },
      },
    )
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{conflict.imei}</TableCell>
      <TableCell className="font-mono text-xs">{conflict.attemptedChange.type}</TableCell>
      <TableCell className="font-mono text-xs max-w-[160px] truncate">{conflict.terminalId}</TableCell>
      <TableCell className="text-xs">{conflict.baseVersion}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" disabled={resolve.isPending} onClick={() => run("keep-server")}>
            {t("sync.keepServer")}
          </Button>
          <Button size="sm" disabled={resolve.isPending} onClick={() => run("apply-terminal")}>
            {t("sync.applyTerminal")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

/** Server conflicts for all terminals; keep-server or apply-terminal per row. */
export function ConflictsTab() {
  const { t } = useI18n()
  const { data, isLoading } = useConflicts()

  if (isLoading) return <Skeleton className="h-40 w-full" />
  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{t("sync.emptyConflicts")}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("sync.colImei")}</TableHead>
          <TableHead>{t("sync.colType")}</TableHead>
          <TableHead>{t("sync.colTerminal")}</TableHead>
          <TableHead>{t("sync.colBaseVersion")}</TableHead>
          <TableHead className="text-right">{t("sync.colActions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((conflict) => (
          <ConflictRow key={conflict.id} conflict={conflict} t={t} />
        ))}
      </TableBody>
    </Table>
  )
}
