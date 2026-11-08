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
    /** Resolved from an IMEI scan; empty when the phone is the customer's own. */
    deviceId: z.string(),
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
    deviceId: "",
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
    deviceId: r.deviceId ?? "",
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

function commonFields(v: RepairFormValues) {
  return {
    deviceName: v.deviceName.trim(),
    problem: v.problem.trim(),
    agreedPrice: Number(v.agreedPrice),
    warrantyDays: Number(v.warrantyDays),
  }
}

/** On create, empty optional fields are omitted (never sent as null). */
function createMaster(v: RepairFormValues) {
  if (v.masterMode === "OWN") return { masterUserId: v.masterUserId }
  if (v.masterMode === "OUTSIDE")
    return {
      outsideMasterName: v.outsideMasterName.trim(),
      ...(v.outsideMasterPhone.trim() ? { outsideMasterPhone: v.outsideMasterPhone.trim() } : {}),
      // Hidden cost: never overwrite the server's value with a guess.
      ...(v.outsideCostHidden ? {} : { outsideCost: Number(v.outsideCost) || 0 }),
    }
  return {}
}

/** On edit, empty optional fields become null so the server actually clears
 *  them; NONE mode explicitly unlinks any existing master. */
function updateMaster(v: RepairFormValues) {
  if (v.masterMode === "OWN") return { masterUserId: v.masterUserId }
  if (v.masterMode === "OUTSIDE")
    return {
      outsideMasterName: v.outsideMasterName.trim(),
      outsideMasterPhone: v.outsideMasterPhone.trim() || null,
      ...(v.outsideCostHidden ? {} : { outsideCost: Number(v.outsideCost) || 0 }),
    }
  return { masterUserId: null, outsideMasterName: null, outsideMasterPhone: null }
}

function customerPart(c: CustomerSelection): Pick<CreateRepairDto, "customerId" | "customer"> {
  if ("customerId" in c) return { customerId: c.customerId }
  return { customer: { name: c.name, phone: c.phone } }
}

export function toCreateDto(v: RepairFormValues, customer: CustomerSelection): CreateRepairDto {
  const imei = v.imei.trim()
  const serial = v.serialNumber.trim()
  const notes = v.notes.trim()
  return {
    ...customerPart(customer),
    ...commonFields(v),
    ...(v.modelId ? { modelId: v.modelId } : {}),
    ...(v.deviceId ? { deviceId: v.deviceId } : {}),
    ...(imei ? { imei } : {}),
    ...(serial ? { serialNumber: serial } : {}),
    ...(notes ? { notes } : {}),
    ...createMaster(v),
  }
}

export function toUpdateDto(v: RepairFormValues): UpdateRepairDto {
  return {
    ...commonFields(v),
    modelId: v.modelId || null,
    deviceId: v.deviceId || null,
    imei: v.imei.trim() || null,
    serialNumber: v.serialNumber.trim() || null,
    notes: v.notes.trim() || null,
    ...updateMaster(v),
  }
}
