import { LogOut, User as UserIcon } from "lucide-react"
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

function UserTriggerButton({ name, email }: { name: string; email: string }) {
  return (
    <Button variant="ghost" className="flex items-center gap-2 h-8 px-2 rounded-full">
      <div className="w-6 h-6 rounded-full bg-[#6647f0]/10 flex items-center justify-center text-[#6647f0] font-bold text-xs">
        {name ? name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
      </div>
      <div className="text-left hidden md:block">
        <p className="text-xs font-semibold leading-none text-[#202020]">{name || email}</p>
        <p className="text-[10px] text-[#838383] mt-0.5">{email}</p>
      </div>
    </Button>
  )
}

export function UserMenu() {
  const { t } = useI18n()
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<UserTriggerButton name={user.profile.fullName} email={user.email} />}
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-bold leading-none text-[#090c1d]">{user.profile.fullName || "User"}</p>
            <p className="text-[11px] text-[#838383]">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-1 pt-1">
              {user.roles.map((r) => (
                <Badge key={r} variant="outline" className="text-[10px]">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() => clearSession()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("auth.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
