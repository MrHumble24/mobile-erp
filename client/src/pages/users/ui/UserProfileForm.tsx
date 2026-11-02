import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useI18n } from "@/shared/i18n"
import { useUpdateUser, type UserView } from "@/entities/user"
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
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100),
  phone: z.string().max(30),
  telegramHandle: z.string().max(100),
  locale: z.string().max(10),
})

type Values = z.infer<typeof schema>

export function UserProfileForm({ user }: { user: UserView }) {
  const { t } = useI18n()
  const update = useUpdateUser()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      phone: user.profile?.phone ?? "",
      telegramHandle: user.profile?.telegramHandle ?? "",
      locale: user.profile?.locale ?? "uz",
    },
  })

  const onSubmit = (values: Values) => {
    update.mutate(
      { id: user.id, dto: { profile: values } },
      {
        onSuccess: () => {
          toast.success(t("users.profileSaved"))
          form.reset(values)
        },
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )
  }

  const field = (name: keyof Values, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {field("firstName", t("users.firstName"))}
          {field("lastName", t("users.lastName"))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field("phone", t("common.phone"))}
          {field("telegramHandle", t("users.telegramHandle"))}
        </div>
        {field("locale", t("users.locale"))}
        <Button
          type="submit"
          disabled={update.isPending || !form.formState.isDirty}
        >
          {update.isPending ? t("common.loading") : t("users.saveProfile")}
        </Button>
      </form>
    </Form>
  )
}
