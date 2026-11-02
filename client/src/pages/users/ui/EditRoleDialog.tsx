import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useI18n } from "@/shared/i18n"
import { useRenameRole, type RoleView } from "@/entities/user"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255),
})

type Values = z.infer<typeof schema>

function EditRoleForm({ role, onDone }: { role: RoleView; onDone: () => void }) {
  const { t } = useI18n()
  const rename = useRenameRole()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: role.name, description: role.description ?? "" },
  })

  const onSubmit = (values: Values) =>
    rename.mutate(
      { code: role.code, dto: values },
      {
        onSuccess: () => {
          toast.success(t("users.roleSaved"))
          onDone()
        },
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("users.roleName")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("users.description")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={rename.isPending}>
          {rename.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function EditRoleDialog({
  role,
  open,
  onOpenChange,
}: {
  role: RoleView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  if (!role) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("users.editRole")}</DialogTitle>
          <DialogDescription>{role.code}</DialogDescription>
        </DialogHeader>
        {open && <EditRoleForm role={role} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
