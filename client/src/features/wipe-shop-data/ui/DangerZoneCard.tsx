import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { WipeDialog } from "./WipeDialog"
import { ResetDialog } from "./ResetDialog"
import { WipeRunsTable } from "./WipeRunsTable"

/**
 * The danger zone at the bottom of the Backups page. Shows data wipe if
 * `data.wipe` is held, and under it a separate Factory Reset block if
 * `data.reset` is held.
 */
export function DangerZoneCard() {
  const { t } = useI18n()
  const canWipe = useAuthStore((s) => s.hasPermission("data.wipe"))
  const canReset = useAuthStore((s) => s.hasPermission("data.reset"))
  const [wipeOpen, setWipeOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  if (!canWipe && !canReset) return null

  return (
    <section className="space-y-4">
      {canWipe && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5 stroke-[2.2]" />
              <CardTitle className="text-destructive">{t("backups.dangerZoneTitle")}</CardTitle>
            </div>
            <CardDescription className="mt-1">{t("backups.dangerZoneDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" onClick={() => setWipeOpen(true)}>
              {t("backups.dangerZoneButton")}
            </Button>
          </CardContent>
        </Card>
      )}

      {canReset && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5 stroke-[2.2]" />
              <CardTitle className="text-destructive">{t("backups.factoryResetTitle")}</CardTitle>
            </div>
            <CardDescription className="mt-1">{t("backups.factoryResetDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="destructive" onClick={() => setResetOpen(true)}>
              {t("backups.factoryResetButton")}
            </Button>
          </CardContent>
        </Card>
      )}

      <WipeRunsTable enabled={!wipeOpen && !resetOpen} />
      {canWipe && <WipeDialog open={wipeOpen} onOpenChange={setWipeOpen} />}
      {canReset && <ResetDialog open={resetOpen} onOpenChange={setResetOpen} />}
    </section>
  )
}
