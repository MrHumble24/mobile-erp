import { useI18n } from "@/shared/i18n"
import { useBackupPlaces } from "@/entities/backup"
import { PlaceCard } from "@/features/manage-backup-place"
import { Skeleton } from "@/shared/ui/skeleton"

/** The storage places as a responsive grid of cards. */
export function BackupPlaces({ canManage }: { canManage: boolean }) {
  const { t } = useI18n()
  const { data: places, isLoading } = useBackupPlaces()

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">{t("backups.placesTitle")}</h2>
      {isLoading && <Skeleton className="h-40 rounded-[16px]" />}
      {places && (
        <div className="grid gap-4 sm:grid-cols-2">
          {places.map((place) => (
            <PlaceCard key={place.code} place={place} canManage={canManage} />
          ))}
        </div>
      )}
    </section>
  )
}
