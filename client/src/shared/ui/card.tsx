import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface CardProps extends React.ComponentProps<"div"> {
  variant?: "limestone" | "ember" | "plasma" | "dark" | "pumice"
}

function Card({
  className,
  variant = "limestone",
  ...props
}: CardProps) {
  const variantStyles = {
    limestone: "bg-limestone text-obsidian border-none",
    ember: "bg-ember text-chalk border-none",
    plasma: "caldera-halftone text-chalk border-none",
    dark: "bg-obsidian text-chalk border-none",
    pumice: "bg-pumice text-obsidian border-[1.5px] border-obsidian/15",
  }[variant]

  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[40px] p-8 md:p-10 lg:p-12 shadow-none transition-colors",
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
      className={cn("flex flex-col gap-3 pb-8", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "font-display text-3xl md:text-4xl lg:text-5xl tracking-[0.02em] uppercase leading-[0.98]",
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
        "font-body text-base font-medium opacity-80 leading-relaxed max-w-xl",
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
      className={cn("space-y-6 md:space-y-8", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center pt-8 font-body text-sm font-medium opacity-70",
        className
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
