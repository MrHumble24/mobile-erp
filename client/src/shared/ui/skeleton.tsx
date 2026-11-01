import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface SkeletonProps extends React.ComponentProps<"div"> {
  shape?: "pill" | "card" | "circle" | "default"
}

function Skeleton({ className, shape = "default", ...props }: SkeletonProps) {
  const shapeClass = {
    default: "rounded-[16px]",
    pill: "rounded-[800px]",
    card: "rounded-[40px]",
    circle: "rounded-full aspect-square",
  }[shape]

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse bg-obsidian/10",
        shapeClass,
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
