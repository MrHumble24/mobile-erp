# Setup Page

First-run wizard for creating the owner account, shop, branch, modules and theme.

## Features
- Composes the setup steps under `ui/steps/`; each step edits one slice of `WizardState`.
- Submits the wizard payload through `model/setup-payload.ts` and the company repository.
- Theme cards are real `Button` controls with `aria-pressed`; their labels come from `setup.*` i18n keys.
