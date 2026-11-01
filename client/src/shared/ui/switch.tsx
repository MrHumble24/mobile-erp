import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/shared/lib/utils"

export interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {}

function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-[800px] border-[1.5px] border-obsidian/30 bg-limestone p-1 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ember/20 disabled:cursor-not-allowed disabled:opacity-40 data-[checked]:bg-ember data-[checked]:border-ember",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-6 rounded-[800px] bg-obsidian transition-transform data-[checked]:translate-x-6 data-[checked]:bg-obsidian"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
