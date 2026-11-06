import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface CardProps extends React.ComponentProps<"div"> {
  variant?: "limestone" | "ember" | "plasma" | "dark" | "pumice" | "white" | "mist"
}

function Card({
  className,
  variant = "white",
  ...props
}: CardProps) {
  const variantStyles = {
    white: "bg-white text-foreground border border-border",
    limestone: "bg-muted text-foreground border border-border",
    mist: "bg-muted text-foreground border border-border",
    pumice: "bg-muted text-foreground border border-border",
    ember: "bg-white text-foreground border border-border",
    plasma: "bg-primary/5 text-foreground border border-primary/20",
    dark: "bg-card text-card-foreground border border-border",
  }[variant]

  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[16px] p-6 shadow-[var(--shadow-xs)] transition-all",
        variantStyles,
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 pb-4", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "font-display text-lg sm:text-xl font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "font-body text-sm font-normal text-muted-foreground leading-normal",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("space-y-4", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center pt-4 font-body text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
