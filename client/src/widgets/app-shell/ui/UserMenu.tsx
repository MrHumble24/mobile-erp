import { useNavigate } from "react-router"
import { LogOut, Settings, ShieldCheck } from "lucide-react"
import { useAuthStore } from "@/features/auth"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Badge } from "@/shared/ui/badge"

function UserTriggerButton({ name, email }: { name?: string; email?: string }) {
  const safeName = (name ?? "").trim()
  const safeEmail = (email ?? "").trim()
  const displayName = safeName || (safeEmail ? safeEmail.split("@")[0] : "") || "User"
  const avatarLetter = (displayName ? displayName.charAt(0) : "U").toUpperCase()

  return (
    <Button variant="ghost" className="flex items-center gap-2 h-9 px-2.5 rounded-full hover:bg-black/[0.04]">
      <div className="size-7 rounded-full bg-[#6647f0]/10 flex items-center justify-center text-[#6647f0] font-bold text-xs shrink-0">
        {avatarLetter}
      </div>
      <div className="text-left hidden md:block max-w-[130px] truncate leading-tight">
        <p className="text-xs font-semibold text-[#202020] truncate">{displayName}</p>
        <p className="text-[10px] text-[#838383] truncate mt-0.5">{safeEmail}</p>
      </div>
    </Button>
  )
}

function UserRoleBadges({ roles }: { roles: string[] }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1 pt-1">
      {roles.map((r) => (
        <Badge key={r} variant="outline" className="text-[10px] px-2 py-0">
          {r}
        </Badge>
      ))}
    </div>
  )
}

function UserQuickNavItems({ onNavigate }: { onNavigate: (to: string) => void }) {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  return (
    <>
      {hasPermission("settings.manage") && (
        <DropdownMenuItem className="cursor-pointer" onClick={() => onNavigate("/settings")}>
          <Settings className="mr-2 h-4 w-4 text-[#838383]" />
          <span>{t("nav.settings")}</span>
        </DropdownMenuItem>
      )}
      {hasPermission("user.manage") && (
        <DropdownMenuItem className="cursor-pointer" onClick={() => onNavigate("/users")}>
          <ShieldCheck className="mr-2 h-4 w-4 text-[#838383]" />
          <span>{t("nav.users")}</span>
        </DropdownMenuItem>
      )}
      {(hasPermission("settings.manage") || hasPermission("user.manage")) && <DropdownMenuSeparator />}
    </>
  )
}

export function UserMenu() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<UserTriggerButton name={user.profile?.fullName} email={user.email} />}
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-bold leading-none text-[#090c1d]">
              {user.profile?.fullName || user.email || "User"}
            </p>
            <p className="text-[11px] text-[#838383] truncate">{user.email || ""}</p>
            <UserRoleBadges roles={user.roles ?? []} />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <UserQuickNavItems onNavigate={navigate} />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer text-[#e53935]"
          onClick={() => clearSession()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("auth.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
