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
    white: "bg-white text-[#202020] border border-[#e8e8e8]",
    limestone: "bg-[#f8f9fa] text-[#202020] border border-[#e8e8e8]",
    mist: "bg-[#f8f9fa] text-[#202020] border border-[#e8e8e8]",
    pumice: "bg-[#e9ebf0] text-[#202020] border border-[#d4d4d4]",
    ember: "bg-white text-[#202020] border border-[#e8e8e8]",
    plasma: "bg-[#6647f0]/5 text-[#090c1d] border border-[#6647f0]/20",
    dark: "bg-[#111111] text-white border border-[#2a2a2a]",
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
        "font-display text-lg sm:text-xl font-bold tracking-tight text-[#090c1d]",
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
        "font-body text-sm font-normal text-[#646464] leading-normal",
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
        "flex items-center pt-4 font-body text-xs font-medium text-[#838383]",
        className
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
