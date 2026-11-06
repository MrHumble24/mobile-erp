import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { WipeDialog } from "./WipeDialog"
import { WipeRunsTable } from "./WipeRunsTable"

/**
 * The danger zone at the bottom of the Backups page (owner only; the page gates
 * it on `data.wipe`). One line of what it does, the button that opens the
 * confirm dialog, and the record of past erases.
 */
export function DangerZoneCard() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <section className="space-y-4">
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5 stroke-[2.2]" />
            <CardTitle className="text-destructive">{t("backups.dangerZoneTitle")}</CardTitle>
          </div>
          <CardDescription className="mt-1">{t("backups.dangerZoneDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
            {t("backups.dangerZoneButton")}
          </Button>
        </CardContent>
      </Card>

      <WipeRunsTable enabled={!open} />
      <WipeDialog open={open} onOpenChange={setOpen} />
    </section>
  )
}
