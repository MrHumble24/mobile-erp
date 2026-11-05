import { toast } from "@/shared/ui/sonner"
import { useI18n } from "@/shared/i18n"
import { useOutboxStore, useDrainNow, type OutboxEntry } from "@/entities/sync"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { formatDateTime } from "@/shared/lib/format"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table"

type T = (k: string, p?: Record<string, string | number>) => string

/** The unit code the mutation carried: whichever of imei / serialNumber was scanned. */
function unitCodeOf(entry: OutboxEntry): string {
  const code = entry.payload.imei ?? entry.payload.serialNumber
  return typeof code === "string" ? code : "—"
}

function QueueRow({ entry, t }: { entry: OutboxEntry; t: T }) {
  const retry = useOutboxStore((s) => s.retry)
  const discard = useOutboxStore((s) => s.discard)
  const drain = useDrainNow()

  const onRetry = () => {
    void retry(entry.id).then(() => {
      drain()
      toast.success(t("sync.retryTriggered"))
    })
  }
  const onDiscard = () => {
    void discard(entry.id).then(() => toast.success(t("sync.discarded")))
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{entry.type}</TableCell>
      <TableCell className="font-mono text-xs">{unitCodeOf(entry)}</TableCell>
      <TableCell className="text-xs">{formatDateTime(entry.occurredAt)}</TableCell>
      <TableCell>
        <Badge variant={entry.status === "rejected" ? "destructive" : "mercury"}>
          {entry.status === "rejected" ? t("sync.statusRejected") : t("sync.statusPending")}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-[#dc2626] max-w-[240px] truncate">{entry.error ?? ""}</TableCell>
      <TableCell className="text-right">
        {entry.status === "rejected" && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={onRetry}>{t("sync.retry")}</Button>
            <Button size="sm" variant="destructive" onClick={onDiscard}>{t("sync.discard")}</Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

/** This terminal's outbox: pending and rejected mutations, with row actions. */
export function QueueTab() {
  const { t } = useI18n()
  const entries = useOutboxStore((s) => s.entries)

  if (entries.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{t("sync.emptyQueue")}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("sync.colType")}</TableHead>
          <TableHead>{t("sync.colImei")}</TableHead>
          <TableHead>{t("sync.colTime")}</TableHead>
          <TableHead>{t("sync.colStatus")}</TableHead>
          <TableHead>{t("sync.colError")}</TableHead>
          <TableHead className="text-right">{t("sync.colActions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <QueueRow key={entry.id} entry={entry} t={t} />
        ))}
      </TableBody>
    </Table>
  )
}
