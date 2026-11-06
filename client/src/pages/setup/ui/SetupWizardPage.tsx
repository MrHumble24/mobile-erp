import { useState } from "react"
import { useNavigate } from "react-router"
import { Card, CardContent } from "@/shared/ui"
import type { WizardState } from "./steps/types"
import { LanguageStep } from "./steps/LanguageStep"
import { OwnerStep } from "./steps/OwnerStep"
import { ShopStep } from "./steps/ShopStep"
import { CurrencyStep } from "./steps/CurrencyStep"
import { BranchStep } from "./steps/BranchStep"
import { SwitchesStep } from "./steps/SwitchesStep"
import { TelegramStep } from "./steps/TelegramStep"
import { ThemeStep } from "./steps/ThemeStep"
import { SummaryStep } from "./steps/SummaryStep"

export function SetupWizardPage() {
  const navigate = useNavigate()

  const [state, setState] = useState<WizardState>({
    step: 1,
    code: "",
    owner: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
    company: {
      name: "",
      legalName: "",
      address: "",
      phone: "",
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
      name: "",
      address: "",
      phone: "",
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
  })

  const nextStep = () => setState((p) => ({ ...p, step: p.step + 1 }))
  const prevStep = () => setState((p) => ({ ...p, step: Math.max(1, p.step - 1) }))

  const onCompleted = () => {
    navigate("/", { replace: true })
  }

  const totalSteps = 9

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx + 1 === state.step
                    ? "w-8 bg-primary"
                    : idx + 1 < state.step
                    ? "w-4 bg-primary/60"
                    : "w-3 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="border-border shadow-md">
          <CardContent className="p-6 sm:p-8">
            {state.step === 1 && (
              <LanguageStep state={state} update={setState} onNext={nextStep} />
            )}
            {state.step === 2 && (
              <OwnerStep state={state} update={setState} onNext={nextStep} onBack={prevStep} />
            )}
            {state.step === 3 && (
              <ShopStep state={state} update={setState} onNext={nextStep} onBack={prevStep} />
            )}
            {state.step === 4 && (
              <CurrencyStep state={state} update={setState} onNext={nextStep} onBack={prevStep} />
            )}
            {state.step === 5 && (
              <BranchStep state={state} update={setState} onNext={nextStep} onBack={prevStep} />
            )}
            {state.step === 6 && (
              <SwitchesStep state={state} update={setState} onNext={nextStep} onBack={prevStep} />
            )}
            {state.step === 7 && (
              <TelegramStep state={state} update={setState} onNext={nextStep} onBack={prevStep} />
            )}
            {state.step === 8 && (
              <ThemeStep state={state} update={setState} onNext={nextStep} onBack={prevStep} />
            )}
            {state.step === 9 && (
              <SummaryStep state={state} update={setState} onBack={prevStep} onSuccess={onCompleted} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
