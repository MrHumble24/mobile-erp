import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {}

function Checkbox({ className, onClick, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input bg-background transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-40 data-[checked]:bg-primary data-[checked]:border-primary data-[checked]:text-primary-foreground flex items-center justify-center cursor-pointer",
        className
      )}
      onClick={(e) => {
        // Stop bubbling so wrapping <label> elements don't trigger duplicate synthetic click on the inner input
        e.stopPropagation()
        onClick?.(e)
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-primary-foreground">
        <Check className="size-3 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
