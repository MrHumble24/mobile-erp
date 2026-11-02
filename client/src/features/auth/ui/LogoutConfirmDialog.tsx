import { LogOut } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { useLogout, type UseLogoutOptions } from "../model/use-logout"

export interface LogoutConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: () => void
  options?: UseLogoutOptions
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  options,
}: LogoutConfirmDialogProps) {
  const { t } = useI18n()
  const { logout } = useLogout({
    ...options,
    onLogout: onConfirm,
  })

  const handleConfirm = () => {
    onOpenChange(false)
    logout()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <div className="size-11 rounded-full bg-[#e53935]/10 flex items-center justify-center text-[#e53935] mb-2">
            <LogOut className="size-5 stroke-[2.2]" />
          </div>
          <DialogTitle>{t("auth.logoutConfirmTitle")}</DialogTitle>
          <DialogDescription className="mt-1">
            {t("auth.logoutConfirmDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
          >
            <LogOut className="size-4 mr-1.5" />
            {t("auth.logout")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}

