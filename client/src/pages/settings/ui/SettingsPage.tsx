import * as React from "react"
import { useSearchParams } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import {
  useSettings,
  useUpdateSettings,
} from "@/entities/settings"
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
  type UpdateCompanyProfileDto,
} from "@/entities/company"
import { formatDateTime } from "@/shared/lib/format"
import { PageHeader } from "@/shared/ui/page-header"
import { Skeleton } from "@/shared/ui/skeleton"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  settingsSchema,
  toFormValues,
  toUpdateDto,
  type SettingsValues,
} from "../model/settings-schema"
import {
  SETTINGS_CATEGORIES,
  type SettingsCategory,
} from "../model/settings-categories"
import { SettingsSidebar } from "./SettingsSidebar"
import { SettingsHeader } from "./SettingsHeader"
import { SettingsDetailPane } from "./SettingsDetailPane"

const BRANCH_CATEGORIES: Set<SettingsCategory> = new Set([
  "identity",
  "sales",
  "discounts",
  "printing",
  "credit",
  "bonus",
  "nasiya",
  "shifts",
  "repairs",
  "telegram",
])

export function SettingsPage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const canManage = useAuthStore(
    (s) => s.user?.permissions?.includes("settings.manage") ?? false,
  )

  const { data: settings, isLoading: isSettingsLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  const { data: companyProfile } = useCompanyProfile()
  const updateCompany = useUpdateCompanyProfile()
  const [companyForm, setCompanyForm] = React.useState<UpdateCompanyProfileDto>({})

  const [search, setSearch] = React.useState("")
  const [mobileDetailOpen, setMobileDetailOpen] = React.useState(false)

  // Selected category from URL query or default to "identity"
  const tabParam = searchParams.get("tab") as SettingsCategory | null
  const activeCategoryId: SettingsCategory =
    tabParam && SETTINGS_CATEGORIES.some((c) => c.id === tabParam)
      ? tabParam
      : "identity"

  const activeCategory =
    SETTINGS_CATEGORIES.find((c) => c.id === activeCategoryId) ??
    SETTINGS_CATEGORIES[0]

  const branchForm = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings ? toFormValues(settings) : undefined,
  })

  // Keep form in sync when settings are loaded or re-fetched
  React.useEffect(() => {
    if (settings) {
      branchForm.reset(toFormValues(settings))
    }
  }, [settings, branchForm])

  const selectCategory = (id: SettingsCategory) => {
    setSearchParams({ tab: id }, { replace: true })
    setMobileDetailOpen(true)
  }

  // Branch form submit
  const onBranchSubmit = (values: SettingsValues) => {
    updateSettings.mutate(toUpdateDto(values), {
      onSuccess: () => {
        toast.success(t("settings.settingsSaved"))
        branchForm.reset(values)
      },
      onError: (err: Error) => toast.error(err.message || t("common.error")),
    })
  }

  // Company form submit
  const onCompanySubmit = () => {
    updateCompany.mutate(companyForm, {
      onSuccess: () => {
        toast.success(t("settings.settingsSaved"))
        setCompanyForm({})
      },
      onError: (err: Error) => toast.error(err.message || t("common.error")),
    })
  }

  const isBranchDirty = branchForm.formState.isDirty
  const isCompanyDirty = Object.keys(companyForm).length > 0

  // Category dirty map for sidebar indicators
  const dirtyMap: Partial<Record<SettingsCategory, boolean>> = {
    identity: isBranchDirty || isCompanyDirty,
    region: isCompanyDirty,
    appearance: isCompanyDirty,
    sales: isBranchDirty,
    discounts: isBranchDirty,
    printing: isBranchDirty,
    credit: isBranchDirty,
    bonus: isBranchDirty,
    nasiya: isBranchDirty,
    shifts: isBranchDirty,
    repairs: isBranchDirty,
    telegram: isBranchDirty,
  }

  const isCategoryBranch = BRANCH_CATEGORIES.has(activeCategoryId)
  const isCurrentDirty = isCategoryBranch ? isBranchDirty : isCompanyDirty
  const isCurrentPending = isCategoryBranch
    ? updateSettings.isPending
    : updateCompany.isPending

  const handleHeaderSave = isCategoryBranch
    ? branchForm.handleSubmit(onBranchSubmit)
    : onCompanySubmit

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Left Sidebar (macOS System Settings Style) */}
        <div
          className={
            mobileDetailOpen
              ? "hidden md:block w-full md:w-72"
              : "block w-full md:w-72"
          }
        >
          <SettingsSidebar
            selected={activeCategoryId}
            onSelect={selectCategory}
            search={search}
            onSearchChange={setSearch}
            dirtyMap={dirtyMap}
          />
        </div>

        {/* Right Detail Pane */}
        <div
          className={
            !mobileDetailOpen
              ? "hidden md:block flex-1 min-w-0 w-full"
              : "block flex-1 min-w-0 w-full"
          }
        >
          <div className="bg-card/50 border border-border/70 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6 backdrop-blur-xs">
            <SettingsHeader
              category={activeCategory}
              isDirty={isCurrentDirty}
              isPending={isCurrentPending}
              onSave={canManage ? handleHeaderSave : undefined}
              canManage={canManage}
              onBackMobile={() => setMobileDetailOpen(false)}
              showBackMobile={mobileDetailOpen}
              lastUpdated={
                settings?.updatedAt
                  ? formatDateTime(settings.updatedAt)
                  : undefined
              }
            />

            {isSettingsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ) : (
              <Form {...branchForm}>
                <form
                  onSubmit={branchForm.handleSubmit(onBranchSubmit)}
                  className="space-y-6"
                >
                  <SettingsDetailPane
                    category={activeCategory}
                    branchForm={branchForm}
                    branchDisabled={!canManage}
                    companyProfile={companyProfile}
                    companyForm={companyForm}
                    onCompanyChange={(patch) =>
                      setCompanyForm((prev) => ({ ...prev, ...patch }))
                    }
                    onSaveCompany={onCompanySubmit}
                    companyIsPending={updateCompany.isPending}
                    canManage={canManage}
                  />
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
