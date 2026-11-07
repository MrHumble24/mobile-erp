import { z } from "zod"
import type {
  CreateRepairDto,
  RepairView,
  UpdateRepairDto,
} from "@/entities/repair"
import type { CustomerSelection } from "@/entities/customer"

export const MASTER_MODES = ["NONE", "OWN", "OUTSIDE"] as const
export type MasterMode = (typeof MASTER_MODES)[number]

/** Shared ticket fields (create + edit). Master-mode consistency is checked in
 *  a superRefine; the server owns the real rules. */
export const repairFormSchema = z
  .object({
    deviceName: z.string().trim().min(1).max(200),
    modelId: z.string(),
    imei: z.string().max(32),
    serialNumber: z.string().max(64),
    problem: z.string().trim().min(1).max(1000),
    agreedPrice: z.number().min(0).max(1_000_000_000),
    warrantyDays: z.number().int().min(0).max(3650),
    notes: z.string().max(1000),
    masterMode: z.enum(MASTER_MODES),
    masterUserId: z.string(),
    outsideMasterName: z.string().max(200),
    outsideMasterPhone: z.string().max(32),
    outsideCost: z.number().min(0).max(1_000_000_000),
    /** True when the server hid the real cost (no `device.cost.view`). Never
     *  send a guessed 0 back on edit — omit the field entirely instead. */
    outsideCostHidden: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.masterMode === "OWN" && !v.masterUserId) {
      ctx.addIssue({ code: "custom", path: ["masterUserId"], message: "required" })
    }
    if (v.masterMode === "OUTSIDE" && !v.outsideMasterName.trim()) {
      ctx.addIssue({ code: "custom", path: ["outsideMasterName"], message: "required" })
    }
  })

export type RepairFormValues = z.infer<typeof repairFormSchema>

export function emptyRepairForm(): RepairFormValues {
  return {
    deviceName: "",
    modelId: "",
    imei: "",
    serialNumber: "",
    problem: "",
    agreedPrice: 0,
    warrantyDays: 0,
    notes: "",
    masterMode: "NONE",
    masterUserId: "",
    outsideMasterName: "",
    outsideMasterPhone: "",
    outsideCost: 0,
    outsideCostHidden: false,
  }
}

export function repairToForm(r: RepairView): RepairFormValues {
  const mode: MasterMode =
    r.master?.kind === "OWN" ? "OWN" : r.master?.kind === "OUTSIDE" ? "OUTSIDE" : "NONE"
  return {
    deviceName: r.deviceName,
    modelId: r.modelId ?? "",
    imei: r.imei ?? "",
    serialNumber: r.serialNumber ?? "",
    problem: r.problem,
    agreedPrice: Number(r.agreedPrice),
    warrantyDays: r.warrantyDays,
    notes: r.notes ?? "",
    masterMode: mode,
    masterUserId: r.master?.kind === "OWN" ? r.master.userId : "",
    outsideMasterName: r.master?.kind === "OUTSIDE" ? r.master.name : "",
    outsideMasterPhone: r.master?.kind === "OUTSIDE" ? (r.master.phone ?? "") : "",
    outsideCost: r.outsideCost == null ? 0 : Number(r.outsideCost),
    outsideCostHidden: r.outsideCost == null,
  }
}

/** The fields shared by create and edit (everything but the customer).
 *  On edit, empty optional fields become null so the server actually clears
 *  them; on create they are simply omitted. */
function sharedFields(v: RepairFormValues, forUpdate: boolean) {
  const clear = <T,>(value: T | "" | undefined): T | null | undefined =>
    value ? value : forUpdate ? null : undefined
  const master =
    v.masterMode === "OWN"
      ? { masterUserId: v.masterUserId }
      : v.masterMode === "OUTSIDE"
        ? {
            outsideMasterName: v.outsideMasterName.trim(),
            outsideMasterPhone: clear(v.outsideMasterPhone.trim()),
            // Hidden cost: never overwrite the server's value with a guess.
            ...(v.outsideCostHidden ? {} : { outsideCost: Number(v.outsideCost) || 0 }),
          }
        : forUpdate
          ? { masterUserId: null, outsideMasterName: null, outsideMasterPhone: null }
          : {}
  return {
    deviceName: v.deviceName.trim(),
    modelId: clear(v.modelId),
    imei: clear(v.imei.trim()),
    serialNumber: clear(v.serialNumber.trim()),
    problem: v.problem.trim(),
    agreedPrice: Number(v.agreedPrice),
    warrantyDays: Number(v.warrantyDays),
    notes: clear(v.notes.trim()),
    ...master,
  }
}

function customerPart(c: CustomerSelection): Pick<CreateRepairDto, "customerId" | "customer"> {
  if ("customerId" in c) return { customerId: c.customerId }
  return { customer: { name: c.name, phone: c.phone } }
}

export function toCreateDto(v: RepairFormValues, customer: CustomerSelection): CreateRepairDto {
  return { ...customerPart(customer), ...sharedFields(v, false) }
}

export function toUpdateDto(v: RepairFormValues): UpdateRepairDto {
  return sharedFields(v, true)
}
