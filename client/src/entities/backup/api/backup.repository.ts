import { http, uploadRaw, downloadBlob } from "@/shared/api/http"
import type {
  BackupRunView,
  BackupSettingsView,
  ConfirmRestoreDto,
  PlaceSecretKind,
  PlaceView,
  RestoreStatusView,
  StagedUpload,
} from "../model/backup.types"

export interface UpdateSettingsDto {
  scheduleEnabled?: boolean
  scheduleTime?: string
  keepLast?: number
}

/** The only place that talks to `/backups`. Returns server views as-is. */
export const backupRepository = {
  // Runs
  listRuns: () => http<BackupRunView[]>("/backups"),
  runBackup: () => http<BackupRunView[]>("/backups", { method: "POST" }),
  deleteRun: (id: string) =>
    http<void>(`/backups/${id}`, { method: "DELETE" }),
  downloadRun: (id: string) => downloadBlob(`/backups/${id}/download`),

  // Settings
  getSettings: () => http<BackupSettingsView>("/backups/settings"),
  updateSettings: (dto: UpdateSettingsDto) =>
    http<BackupSettingsView>("/backups/settings", { method: "PUT", body: dto }),
  setPassphrase: (passphrase: string) =>
    http<void>("/backups/passphrase", { method: "PUT", body: { passphrase } }),

  // Places
  listPlaces: () => http<PlaceView[]>("/backups/places"),
  setPlaceEnabled: (code: string, enabled: boolean) =>
    http<PlaceView>(`/backups/places/${code}/enabled`, {
      method: "PUT",
      body: { enabled },
    }),
  setPlaceSettings: (code: string, chatId: string) =>
    http<PlaceView>(`/backups/places/${code}/settings`, {
      method: "PUT",
      body: { chatId },
    }),
  setPlaceSecret: (code: string, kind: PlaceSecretKind, value: string) =>
    http<void>(`/backups/places/${code}/secret`, {
      method: "PUT",
      body: { kind, value },
    }),
  testPlace: (code: string) =>
    http<PlaceView>(`/backups/places/${code}/test`, { method: "POST" }),
  disconnectPlace: (code: string) =>
    http<PlaceView>(`/backups/places/${code}/disconnect`, { method: "POST" }),

  // OAuth
  redirectUri: (code: string) =>
    http<{ redirectUri: string }>(`/backups/oauth/${code}/redirect-uri`),
  oauthStart: (code: string, returnTo: string) =>
    http<{ url: string }>(`/backups/oauth/${code}/start`, {
      params: { returnTo },
    }),

  // Restore
  restoreStatus: () => http<RestoreStatusView>("/backups/restore/status"),
  restoreFromRun: (id: string, dto: ConfirmRestoreDto) =>
    http<{ ok: true }>(`/backups/${id}/restore`, { method: "POST", body: dto }),
  stageUpload: (file: Blob) =>
    uploadRaw<StagedUpload>("/backups/uploads", file),
  restoreFromUpload: (uploadId: string, dto: ConfirmRestoreDto) =>
    http<{ ok: true }>(`/backups/uploads/${uploadId}/restore`, {
      method: "POST",
      body: dto,
    }),
}
