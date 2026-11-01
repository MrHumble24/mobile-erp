import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2.5 font-body font-medium transition-all select-none outline-none whitespace-nowrap leading-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer shadow-none tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-ember text-obsidian rounded-[800px] hover:brightness-105 active:scale-[0.99] border-none shadow-none",
        secondary:
          "bg-limestone text-obsidian rounded-[800px] border-[1.5px] border-obsidian/20 hover:border-obsidian active:scale-[0.99] shadow-none",
        outline:
          "bg-transparent text-obsidian border-[1.5px] border-obsidian rounded-[800px] hover:bg-limestone active:scale-[0.99] shadow-none",
        pillOutline:
          "bg-transparent text-obsidian border-[1.5px] border-obsidian rounded-[800px] hover:bg-limestone active:scale-[0.99] shadow-none",
        ghost:
          "bg-transparent text-obsidian rounded-[800px] hover:bg-limestone active:scale-[0.99] border-none shadow-none",
        destructive:
          "bg-ember text-chalk rounded-[800px] hover:brightness-110 active:scale-[0.99] border-none shadow-none",
        link:
          "text-obsidian underline-offset-4 hover:underline p-0 h-auto rounded-none border-none",
      },
      size: {
        default: "h-14 px-8 text-base",
        sm: "h-12 px-6 text-sm",
        lg: "h-16 px-10 text-lg",
        icon: "size-14 rounded-[800px] p-0",
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
