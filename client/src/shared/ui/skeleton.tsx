import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface SkeletonProps extends React.ComponentProps<"div"> {
  shape?: "pill" | "card" | "circle" | "default"
}

function Skeleton({ className, shape = "default", ...props }: SkeletonProps) {
  const shapeClass = {
    default: "rounded-[8px]",
    pill: "rounded-full",
    card: "rounded-[12px]",
    circle: "rounded-full aspect-square",
  }[shape]

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse bg-[#eeeeee]",
        shapeClass,
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
