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
            "group toast group-[.toaster]:bg-limestone group-[.toaster]:text-obsidian group-[.toaster]:border-[1.5px] group-[.toaster]:border-obsidian/20 group-[.toaster]:shadow-none group-[.toaster]:rounded-[24px] group-[.toaster]:p-5 group-[.toaster]:font-body group-[.toaster]:font-medium",
          description: "group-[.toast]:text-obsidian/70 group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-ember group-[.toast]:text-obsidian group-[.toast]:rounded-[800px] group-[.toast]:font-medium group-[.toast]:px-4 group-[.toast]:py-2",
          cancelButton:
            "group-[.toast]:bg-pumice group-[.toast]:text-obsidian group-[.toast]:rounded-[800px] group-[.toast]:font-medium group-[.toast]:px-4 group-[.toast]:py-2",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
