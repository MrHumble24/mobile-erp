import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useI18n } from "@/shared/i18n"
import { useResetPassword } from "@/entities/user"
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

const schema = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "mismatch",
  })

type Values = z.infer<typeof schema>

function ResetPasswordForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { t } = useI18n()
  const reset = useResetPassword()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  })

  const onSubmit = (values: Values) => {
    reset.mutate(
      { id: userId, dto: { password: values.password } },
      {
        onSuccess: () => {
          toast.success(t("users.passwordReset"))
          onDone()
        },
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-2">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("users.newPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("users.confirmPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={reset.isPending}>
          {reset.isPending ? t("common.loading") : t("users.resetPassword")}
        </Button>
      </form>
    </Form>
  )
}

export function ResetPasswordDialog({
  userId,
  email,
  open,
  onOpenChange,
}: {
  userId: string
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("users.resetPassword")}</DialogTitle>
          <DialogDescription>{email}</DialogDescription>
        </DialogHeader>
        {open && <ResetPasswordForm userId={userId} onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
