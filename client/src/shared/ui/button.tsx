import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 font-display font-bold transition-all select-none outline-none whitespace-nowrap leading-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer shadow-none tracking-tight focus-visible:ring-2 focus-visible:ring-ring/30",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground rounded-full hover:bg-primary/90 active:scale-[0.99] border-none shadow-none",
        secondary:
          "bg-muted text-foreground rounded-full border border-border hover:bg-muted active:scale-[0.99] shadow-none",
        outline:
          "bg-transparent text-foreground border border-border rounded-full hover:bg-muted hover:border-foreground/40 active:scale-[0.99] shadow-none",
        pillOutline:
          "bg-transparent text-foreground border border-border rounded-full hover:bg-muted active:scale-[0.99] shadow-none",
        ghost:
          "bg-transparent text-foreground rounded-full font-medium hover:bg-accent hover:text-accent-foreground active:scale-[0.99] border-none shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 active:scale-[0.99] border-none shadow-none",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto rounded-none border-none font-medium",
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
