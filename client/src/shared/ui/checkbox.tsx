import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export interface CheckboxProps extends React.ComponentProps<typeof CheckboxPrimitive.Root> {}

function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-6 shrink-0 rounded-[8px] border-[1.5px] border-obsidian/40 bg-limestone transition-all outline-none focus-visible:ring-4 focus-visible:ring-ember/20 disabled:cursor-not-allowed disabled:opacity-40 data-[checked]:bg-ember data-[checked]:border-ember data-[checked]:text-obsidian flex items-center justify-center cursor-pointer",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-obsidian">
        <Check className="size-4 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
