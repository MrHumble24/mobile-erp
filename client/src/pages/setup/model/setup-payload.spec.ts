/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { buildSetupPayload } from "./setup-payload.ts"
import type { WizardState } from "../ui/steps/types.ts"

test("buildSetupPayload strips 'step' and formats valid payload", () => {
  const wizardState: WizardState = {
    step: 9,
    code: "ABCD1234EF567890",
    owner: {
      email: "owner@shop.uz",
      password: "securePassword123",
      firstName: "Alex",
      lastName: "Smith",
      phone: "+998901234567",
    },
    company: {
      name: "Apex Store",
      legalName: "Apex LLC",
      address: "Navoiy 12",
      phone: "+998901234567",
      country: "UZ",
      timeZone: "Asia/Tashkent",
      defaultLanguage: "uz",
      currencyCode: "USD",
      currencySign: "$",
      currencySignPosition: "before",
      currencyDecimals: 2,
      themeCode: "caldera",
    },
    firstStore: {
      name: "Main Branch",
      address: "Navoiy 12",
      phone: "+998901234567",
    },
    switches: {
      discountsEnabled: true,
      shiftsEnabled: true,
      repairsEnabled: false,
      customerCreditEnabled: false,
      bonusEnabled: false,
      receiptPrintingEnabled: false,
    },
    telegram: {
      botToken: "",
      chatId: "",
    },
  }

  const payload = buildSetupPayload(wizardState)

  // Verify 'step' is NOT present
  assert.equal("step" in payload, false)
  assert.equal((payload as any).step, undefined)

  // Verify properties
  assert.equal(payload.code, "ABCD1234EF567890")
  assert.equal(payload.owner.firstName, "Alex")
  assert.equal(payload.company.name, "Apex Store")
  assert.equal(payload.firstStore?.name, "Main Branch")
  assert.equal(payload.telegram, undefined) // Empty telegram omitted
})