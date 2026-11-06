import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBranding } from "@/entities/company"
import { useI18n } from "@/shared/i18n"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { loginSchema, type LoginFormValues } from "../model/login.schema"
import { useLogin } from "../model/use-login"

interface LoginFormProps {
  onSuccess?: () => void
}

function EmailField({
  form,
  isPending,
}: {
  form: UseFormReturn<LoginFormValues>
  isPending: boolean
}) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("auth.emailLabel")}</FormLabel>
          <FormControl>
            <Input
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
              disabled={isPending}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function PasswordField({
  form,
  isPending,
}: {
  form: UseFormReturn<LoginFormValues>
  isPending: boolean
}) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("auth.passwordLabel")}</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder={t("auth.passwordPlaceholder")}
              autoComplete="current-password"
              disabled={isPending}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useI18n()
  const { data: branding } = useBranding()
  const loginMutation = useLogin()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => onSuccess?.(),
    })
  }

  return (
    <Card className="w-full max-w-md shadow-[var(--shadow-lg)] border border-border bg-white rounded-[20px]">
      <CardHeader className="text-center space-y-2">
        {branding?.logoUrl && (
          <div className="flex justify-center mb-1">
            <img src={branding.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
          </div>
        )}
        <CardTitle className="text-2xl font-bold tracking-tight">{t("auth.loginTitle")}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("auth.loginSubtitle", { shopName: branding?.name || "ERP" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {loginMutation.isError && (
              <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium">
                {loginMutation.error?.message || t("auth.invalidCredentials")}
              </div>
            )}
            <EmailField form={form} isPending={loginMutation.isPending} />
            <PasswordField form={form} isPending={loginMutation.isPending} />
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? t("auth.loggingIn") : t("auth.loginButton")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
