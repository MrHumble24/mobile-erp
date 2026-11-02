import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-display font-bold transition-all select-none outline-none whitespace-nowrap leading-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer shadow-none tracking-tight",
  {
    variants: {
      variant: {
        default:
          "bg-[#202020] text-white rounded-full hover:bg-[#2a2a2a] active:scale-[0.99] border-none shadow-none",
        secondary:
          "bg-[#f8f9fa] text-[#202020] rounded-full border border-[#e8e8e8] hover:bg-[#eeeeee] active:scale-[0.99] shadow-none",
        outline:
          "bg-transparent text-[#202020] border border-[#e8e8e8] rounded-full hover:bg-[#f8f9fa] hover:border-[#b3b3b3] active:scale-[0.99] shadow-none",
        pillOutline:
          "bg-transparent text-[#202020] border border-[#e8e8e8] rounded-full hover:bg-[#f8f9fa] active:scale-[0.99] shadow-none",
        ghost:
          "bg-transparent text-[#2a2a2a] rounded-full font-medium hover:bg-black/[0.04] active:scale-[0.99] border-none shadow-none",
        destructive:
          "bg-[#e53935] text-white rounded-full hover:bg-[#d32f2f] active:scale-[0.99] border-none shadow-none",
        link:
          "text-[#0091ff] underline-offset-4 hover:underline p-0 h-auto rounded-none border-none font-medium",
      },
      size: {
        default: "h-9 px-5 text-sm",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-11 px-6 text-sm",
        icon: "size-9 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
