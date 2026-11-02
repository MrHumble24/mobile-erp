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
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#202020] group-[.toaster]:border group-[.toaster]:border-[#e8e8e8] group-[.toaster]:shadow-[var(--shadow-subtle-2)] group-[.toaster]:rounded-[12px] group-[.toaster]:p-4 group-[.toaster]:font-body group-[.toaster]:font-medium",
          description: "group-[.toast]:text-[#646464] group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-[#202020] group-[.toast]:text-white group-[.toast]:rounded-full group-[.toast]:font-semibold group-[.toast]:px-3.5 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-[#f8f9fa] group-[.toast]:text-[#202020] group-[.toast]:rounded-full group-[.toast]:font-semibold group-[.toast]:px-3.5 group-[.toast]:py-1.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
