import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/shared/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
  rangeLabel: (from: number, to: number, total: number) => string
  perPageLabel?: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

function PageSizeSelect({
  pageSize,
  options,
  onChange,
}: {
  pageSize: number
  options: number[]
  onChange: (n: number) => void
}) {
  return (
    <Select value={String(pageSize)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="h-9 w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={String(opt)}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function Pagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [25, 50, 100],
  rangeLabel,
  perPageLabel,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
      <span className="text-sm text-muted-foreground">{rangeLabel(from, to, total)}</span>
      <div className="flex items-center gap-2">
        {perPageLabel ? (
          <span className="text-xs text-muted-foreground hidden sm:inline">{perPageLabel}</span>
        ) : null}
        <PageSizeSelect pageSize={pageSize} options={pageSizeOptions} onChange={onPageSizeChange} />
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
