import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-[var(--shadow-subtle-2)] group-[.toaster]:rounded-[12px] group-[.toaster]:p-4 group-[.toaster]:font-body group-[.toaster]:font-medium",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-full group-[.toast]:font-semibold group-[.toast]:px-3.5 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-foreground group-[.toast]:rounded-full group-[.toast]:font-semibold group-[.toast]:px-3.5 group-[.toast]:py-1.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
