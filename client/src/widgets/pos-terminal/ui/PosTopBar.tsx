import * as React from "react"
import { useNavigate } from "react-router"
import { LogOut, Maximize2, Minimize2, ReceiptText, ScanLine, Wrench } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import {
  Sheet,
  SheetPopup,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"
import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"
import { useOutboxStore, selectPendingCount, selectRejectedCount } from "@/entities/sync"
import type { usePosTerminal } from "../model/use-pos-terminal"
import type { FullscreenControls } from "../model/use-fullscreen"
import { ModeSwitch } from "./ModeSwitch"
import { InputModeSwitch } from "./InputModeSwitch"
import { ShortcutsHelp } from "./ShortcutsHelp"
import { SessionPanel } from "./SessionPanel"

type Pos = ReturnType<typeof usePosTerminal>

/** Compact sync state. The till is offline-first, so this is never hidden. */
function PosSyncPill({ online }: { online: boolean }) {
  const { t } = useI18n()
  const pending = useOutboxStore(selectPendingCount)
  const rejected = useOutboxStore(selectRejectedCount)
  return (
    <div
      className="hidden h-8 items-center gap-2 rounded-full border border-border bg-card px-3 text-[11px] font-semibold sm:inline-flex"
      title={online ? t("sync.online") : t("sync.offline")}
    >
      <span className={cn("size-2 shrink-0 rounded-full", online ? "bg-emerald-500" : "bg-amber-500")} />
      <span className="text-muted-foreground">{online ? t("sync.online") : t("sync.offline")}</span>
      {pending > 0 && <span className="text-blue-600 dark:text-blue-400">↑{pending}</span>}
      {rejected > 0 && <span className="text-destructive">!{rejected}</span>}
    </div>
  )
}

export interface PosTopBarProps {
  pos: Pos
  fullscreen: FullscreenControls
}

/**
 * One slim bar for everything that is not the sale itself: mode, input method,
 * sync state, and the secondary tools (today's sales, shortcuts, repairs,
 * fullscreen, exit). Reference info lives behind a button instead of taking
 * space on the till canvas.
 */
export function PosTopBar({ pos, fullscreen }: PosTopBarProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [sessionOpen, setSessionOpen] = React.useState(false)
  const { data: settings } = useSettings()
  const canOpenRepairs =
    useAuthStore((s) => s.hasPermission("repair.read")) && Boolean(settings?.repairsEnabled)

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-2.5">
        <div className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-primary text-primary-foreground">
          <ScanLine className="size-5" />
        </div>
        <p className="hidden font-display text-sm font-bold tracking-tight sm:block">
          {t("pos.title")}
        </p>
      </div>

      <div className="mx-1 hidden h-6 w-px shrink-0 bg-border lg:block" />

      <ModeSwitch mode={pos.mode} onModeChange={pos.setMode} />
      <InputModeSwitch mode={pos.inputMode} onModeChange={pos.setInputMode} />

      <div className="ml-auto flex items-center gap-1">
        <PosSyncPill online={pos.online} />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setSessionOpen(true)}
          aria-label={t("pos.todaySales")}
          title={t("pos.todaySales")}
        >
          <ReceiptText className="size-5" />
        </Button>

        <ShortcutsHelp />

        {canOpenRepairs && (
          <Link
            to="/repairs"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            aria-label={t("pos.openRepairs")}
            title={t("pos.openRepairs")}
          >
            <Wrench className="size-4" />
          </Link>
        )}

        {fullscreen.supported && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={fullscreen.toggle}
            aria-pressed={fullscreen.isFullscreen}
            aria-label={fullscreen.isFullscreen ? t("pos.fullscreenExit") : t("pos.fullscreen")}
            title={fullscreen.isFullscreen ? t("pos.fullscreenExit") : t("pos.fullscreen")}
          >
            {fullscreen.isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          aria-label={t("pos.exit")}
          title={t("pos.exit")}
        >
          <LogOut className="size-4" />
        </Button>
      </div>

      <Sheet open={sessionOpen} onOpenChange={setSessionOpen}>
        <SheetPopup className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("pos.todaySales")}</SheetTitle>
          </SheetHeader>
          <SessionPanel
            soldById={pos.me}
            onOpenReceipt={(id) => {
              setSessionOpen(false)
              pos.openReceipt([id])
            }}
          />
        </SheetPopup>
      </Sheet>
    </header>
  )
}
