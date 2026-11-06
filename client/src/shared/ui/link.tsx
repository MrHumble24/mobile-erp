import * as React from "react"
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router"
import { cn } from "@/shared/lib/utils"

export interface LinkProps extends RouterLinkProps {
  className?: string
  children?: React.ReactNode
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <RouterLink
        ref={ref}
        className={cn("text-primary hover:underline font-medium transition-colors", className)}
        {...props}
      >
        {children}
      </RouterLink>
    )
  }
)

Link.displayName = "Link"
