import * as React from "react"
import { isNetworkError } from "@/shared/api/http"
import { codeToIdentifier } from "@/entities/device"
import { enqueueMutation, MUTATION_TYPES } from "@/entities/sync"
import { useCreateConsignment, type ConsignmentView } from "@/entities/consignment"

export interface DeviceRow {
  key: string
  imei: string
  agreedPrice: string
}

function newRow(imei = "", agreedPrice = ""): DeviceRow {
  return { key: crypto.randomUUID(), imei, agreedPrice }
}

export interface ConsignFormState {
  partnerId: string
  setPartnerId: (v: string) => void
  dueDate: string
  setDueDate: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  rows: DeviceRow[]
  addRow: () => void
  removeRow: (key: string) => void
  updateRow: (key: string, patch: Partial<DeviceRow>) => void
  isPending: boolean
}

/**
 * Drives the one-or-many consignment transfer form. Each device row carries its
 * own IMEI + agreed price; partner, due date and notes are shared. Submit calls
 * the idempotent create endpoint once per row, sequentially (own clientMutationId
 * each), so a partial batch never double-writes on retry.
 */
export function useConsignForm(opts: {
  initialImei?: string
  initialAgreedPrice?: string
  initialPartnerId?: string
}): ConsignFormState & {
  submit: () => Promise<{ created: ConsignmentView[]; queued: number; error: unknown }>
} {
  const createMutation = useCreateConsignment()
  const [partnerId, setPartnerId] = React.useState(opts.initialPartnerId ?? "")
  const [dueDate, setDueDate] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [rows, setRows] = React.useState<DeviceRow[]>([
    newRow(opts.initialImei, opts.initialAgreedPrice),
  ])

  const addRow = React.useCallback(() => setRows((r) => [...r, newRow()]), [])
  const removeRow = React.useCallback(
    (key: string) => setRows((r) => (r.length > 1 ? r.filter((x) => x.key !== key) : r)),
    []
  )
  const updateRow = React.useCallback(
    (key: string, patch: Partial<DeviceRow>) =>
      setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x))),
    []
  )

  const submit = React.useCallback(async () => {
    const valid = rows.filter((r) => r.imei.trim() && r.agreedPrice)
    const created: ConsignmentView[] = []
    let queued = 0
    const iso = new Date(dueDate).toISOString()
    for (const row of valid) {
      const clientMutationId = crypto.randomUUID()
      const dto = {
        partnerId,
        ...codeToIdentifier(row.imei),
        agreedPrice: Number(row.agreedPrice),
        dueDate: iso,
        notes: notes.trim() || undefined,
        clientMutationId,
      }
      try {
        created.push(await createMutation.mutateAsync(dto))
      } catch (error) {
        // Offline: queue the transfer; device version is unknown here so no
        // optimistic baseVersion is sent (the server resolves by imei).
        if (isNetworkError(error)) {
          await enqueueMutation({
            id: clientMutationId,
            type: MUTATION_TYPES.consignmentCreate,
            payload: dto as unknown as Record<string, unknown>,
          })
          queued += 1
          continue
        }
        return { created, queued, error }
      }
    }
    return { created, queued, error: null }
  }, [rows, dueDate, partnerId, notes, createMutation])

  return {
    partnerId,
    setPartnerId,
    dueDate,
    setDueDate,
    notes,
    setNotes,
    rows,
    addRow,
    removeRow,
    updateRow,
    isPending: createMutation.isPending,
    submit,
  }
}
