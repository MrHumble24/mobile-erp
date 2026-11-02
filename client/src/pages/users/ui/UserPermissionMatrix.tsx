import * as React from "react"
import { useI18n } from "@/shared/i18n"
import {
  usePermissions,
  useUserEffectivePermissions,
  useSetUserPermissions,
  type PermissionView,
  type UserView,
} from "@/entities/user"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/sonner"
import { PermissionOverrideRow, type OverrideState } from "./PermissionOverrideRow"

type StateMap = Record<string, OverrideState>

function groupByResource(perms: PermissionView[]): Record<string, PermissionView[]> {
  const map: Record<string, PermissionView[]> = {}
  for (const p of perms) (map[p.resource] ??= []).push(p)
  return map
}

export function UserPermissionMatrix({
  user,
  isSelf,
}: {
  user: UserView
  isSelf: boolean
}) {
  const { t } = useI18n()
  const { data: permissions } = usePermissions()
  const { data: breakdown, isLoading } = useUserEffectivePermissions(user.id)
  const setPermissions = useSetUserPermissions()

  const initial = React.useMemo<StateMap>(() => {
    const map: StateMap = {}
    for (const o of breakdown?.overrides ?? []) {
      map[o.permissionCode] = o.granted ? "grant" : "revoke"
    }
    return map
  }, [breakdown])

  const [state, setState] = React.useState<StateMap>({})
  React.useEffect(() => setState(initial), [initial])

  const roleCodesFor = React.useCallback(
    (code: string) =>
      breakdown?.roleGrants.find((g) => g.permissionCode === code)?.roleCodes ?? [],
    [breakdown]
  )

  const stateFor = (code: string): OverrideState => state[code] ?? "inherit"
  const dirty = React.useMemo(
    () =>
      Object.keys({ ...initial, ...state }).some(
        (code) => (initial[code] ?? "inherit") !== (state[code] ?? "inherit")
      ),
    [initial, state]
  )

  if (isLoading || !permissions || !breakdown) {
    return <Skeleton className="h-64 rounded-[16px]" />
  }

  const save = () => {
    const overrides = Object.entries(state)
      .filter(([, s]) => s !== "inherit")
      .map(([permissionCode, s]) => ({ permissionCode, granted: s === "grant" }))
    setPermissions.mutate(
      { id: user.id, dto: { overrides } },
      {
        onSuccess: () => toast.success(t("users.overridesSaved")),
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )
  }

  const groups = groupByResource(permissions)

  return (
    <div className="space-y-4">
      {isSelf && (
        <p className="text-xs text-muted-foreground">{t("users.selfPermsLocked")}</p>
      )}
      {dirty && !isSelf && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-[12px] border border-[#e8e8e8] bg-white p-3 shadow-[var(--shadow-xs)]">
          <span className="text-xs text-muted-foreground">{t("users.unsavedChanges")}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setState(initial)}>
              {t("common.cancel")}
            </Button>
            <Button size="sm" onClick={save} disabled={setPermissions.isPending}>
              {setPermissions.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </div>
      )}
      {Object.entries(groups).map(([resource, perms]) => (
        <div
          key={resource}
          className="space-y-1 rounded-[16px] border border-[#e8e8e8] bg-white p-4 shadow-[var(--shadow-xs)]"
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {resource}
          </h4>
          {perms.map((p) => (
            <PermissionOverrideRow
              key={p.code}
              permission={p}
              state={stateFor(p.code)}
              roleCodes={roleCodesFor(p.code)}
              disabled={isSelf}
              onChange={(s) => setState((prev) => ({ ...prev, [p.code]: s }))}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
