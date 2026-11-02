import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/shared/lib/utils"

export interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {}

function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-[#d4d4d4] p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0091ff]/30 disabled:cursor-not-allowed disabled:opacity-40 data-[checked]:bg-[#202020]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-white shadow-xs transition-transform data-[checked]:translate-x-4"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
