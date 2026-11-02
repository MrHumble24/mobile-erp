import * as React from "react"
import { BarChart3, Download, TableProperties } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { downloadCsv } from "@/shared/lib/csv"
import { Button } from "@/shared/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

export interface ChartCsv {
  filename: string
  headers: string[]
  rows: Array<Array<string | number>>
}

export interface ChartCardProps {
  title: string
  description?: string
  isLoading?: boolean
  error?: unknown
  isEmpty?: boolean
  csv?: ChartCsv
  chart: React.ReactNode
  table: React.ReactNode
}

function ChartCardToolbar({
  view,
  onToggle,
  csv,
}: {
  view: "chart" | "table"
  onToggle: () => void
  csv?: ChartCsv
}) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 rounded-full px-3 text-xs"
        onClick={onToggle}
      >
        {view === "chart" ? (
          <TableProperties className="size-3.5" />
        ) : (
          <BarChart3 className="size-3.5" />
        )}
        {view === "chart" ? t("reports.showTable") : t("reports.showChart")}
      </Button>
      {csv && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full px-3 text-xs"
          onClick={() => downloadCsv(csv.filename, csv.headers, csv.rows)}
        >
          <Download className="size-3.5" />
          {t("reports.exportCsv")}
        </Button>
      )}
    </div>
  )
}

function ChartCardBody({
  isLoading,
  error,
  isEmpty,
  view,
  chart,
  table,
}: Pick<ChartCardProps, "isLoading" | "error" | "isEmpty" | "chart" | "table"> & {
  view: "chart" | "table"
}) {
  const { t } = useI18n()
  if (isLoading) return <Skeleton className="h-[260px] w-full rounded-[12px]" />
  if (error)
    return (
      <p className="py-10 text-center text-sm text-destructive">
        {t("common.error")}
      </p>
    )
  if (isEmpty)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {t("reports.empty")}
      </p>
    )
  return <>{view === "chart" ? chart : table}</>
}

export function ChartCard({
  title,
  description,
  isLoading,
  error,
  isEmpty,
  csv,
  chart,
  table,
}: ChartCardProps) {
  const [view, setView] = React.useState<"chart" | "table">("chart")
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {!isLoading && !error && !isEmpty && (
          <ChartCardToolbar
            view={view}
            onToggle={() => setView((v) => (v === "chart" ? "table" : "chart"))}
            csv={csv}
          />
        )}
      </CardHeader>
      <ChartCardBody
        isLoading={isLoading}
        error={error}
        isEmpty={isEmpty}
        view={view}
        chart={chart}
        table={table}
      />
    </Card>
  )
}
