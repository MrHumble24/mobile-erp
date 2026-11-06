import * as React from "react"
import { ChevronRight } from "lucide-react"
import { Link } from "./link"
import { cn } from "@/shared/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}

function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight className="size-3 text-[#b3b3b3] shrink-0" />}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn("truncate max-w-[150px] sm:max-w-none", isLast && "font-medium text-foreground")}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

function PageHeaderContent({
  title,
  description,
  badge,
  breadcrumbs,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
}) {
  return (
    <div className="space-y-1 min-w-0">
      {breadcrumbs && breadcrumbs.length > 0 && <PageBreadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {title}
        </h1>
        {badge}
      </div>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground font-body max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60",
        className
      )}
      {...props}
    >
      <PageHeaderContent
        title={title}
        description={description}
        badge={badge}
        breadcrumbs={breadcrumbs}
      />
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </header>
  )
}
