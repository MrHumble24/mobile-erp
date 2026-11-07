import { test } from "node:test"
import assert from "node:assert/strict"
import {
  emptyRepairForm,
  repairToForm,
  toCreateDto,
  toUpdateDto,
  type RepairFormValues,
} from "./repair-ticket-schema.ts"
import type { RepairView } from "../../../entities/repair/model/repair.types.ts"

function view(patch: Partial<RepairView> = {}): RepairView {
  return {
    id: "r1",
    ticketNumber: 7,
    customer: { id: "c1", name: "Mustafo", phone: "+998900001122" },
    deviceName: "iPhone 12",
    modelId: null,
    model: null,
    imei: null,
    serialNumber: null,
    problem: "Ekran singan",
    agreedPrice: "350000.00",
    warrantyDays: 30,
    notes: null,
    master: null,
    outsideCost: null,
    statusCode: "RECEIVED",
    statusLabel: "Qabul qilindi",
    isTerminal: false,
    receivedBy: { id: "u1", name: "Owner" },
    receivedAt: "2026-11-08T10:00:00.000Z",
    createdAt: "2026-11-08T10:00:00.000Z",
    updatedAt: "2026-11-08T10:00:00.000Z",
    parts: [],
    payments: [],
    statusHistory: [],
    paid: "0.00",
    outstanding: "350000.00",
    partsCost: null,
    outsidePaid: null,
    profit: null,
    givenBackAt: null,
    warrantyUntil: null,
    underWarranty: false,
    ...patch,
  }
}

function outsideForm(hidden: boolean): RepairFormValues {
  return {
    ...emptyRepairForm(),
    masterMode: "OUTSIDE",
    outsideMasterName: "Usta Ali",
    outsideCost: 120000,
    outsideCostHidden: hidden,
  }
}

test("repairToForm flags a hidden outside cost instead of guessing 0", () => {
  const form = repairToForm(view({ outsideCost: null, master: { kind: "OUTSIDE", name: "Ali", phone: null } }))
  assert.equal(form.outsideCostHidden, true)
  assert.equal(form.masterMode, "OUTSIDE")
})

test("editing a hidden-cost ticket never sends outsideCost (data-loss regression)", () => {
  const dto = toUpdateDto(outsideForm(true))
  assert.equal("outsideCost" in dto, false)
  assert.equal(dto.outsideMasterName, "Usta Ali")
})

test("editing a visible-cost ticket sends the edited outsideCost", () => {
  const dto = toUpdateDto(outsideForm(false))
  assert.equal(dto.outsideCost, 120000)
})

test("NONE master mode clears master fields on edit but not on create", () => {
  const update = toUpdateDto(emptyRepairForm())
  assert.equal(update.masterUserId, null)
  assert.equal(update.outsideMasterName, null)
  const create = toCreateDto(emptyRepairForm(), { customerId: "c1" })
  assert.equal("masterUserId" in create, false)
  assert.equal(create.customerId, "c1")
})

test("empty optional fields are cleared on edit, omitted on create", () => {
  const update = toUpdateDto(emptyRepairForm())
  assert.equal(update.modelId, null)
  assert.equal(update.imei, null)
  const create = toCreateDto(emptyRepairForm(), { customerId: "c1" })
  assert.equal(create.modelId, undefined)
  assert.equal(create.imei, undefined)
})
