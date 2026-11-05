# 004 — Step 11, part 2 of 6: the customer's bonus points

Status: open · Owner: OpenCode (Big Pickle) · Depends on: 003 (merged)

## Why
Part 2 of the step 11 website work (see 003 for the list of parts). The server keeps a points
ledger per customer (ADR 0043). The website must show a customer's points and let the owner correct
them. Paying with points at the till is part 3, not this one.

=== MESSAGE ===
Show a customer's bonus points on the website and let the owner correct them. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/step11-customer-points`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (Feature-Sliced Design and its import rule, React Query only inside `model/use-*.ts` hooks, HTTP only through `shared/api/http.ts` in a repository, query keys from a key factory, shadcn components from `shared/ui`, no native form elements, one component per file, files ≤300 lines, no new dependency). Then read `docs/decisions/0043-bonus-points.md`, `server/src/bonus/README.md`, `server/src/bonus/types/*.ts`, `server/src/bonus/dto/*.ts` and `server/src/customers/customers.service.ts`, so every field name and type comes from the server and none is guessed.

What the server gives (already working):
- `GET /customers/lookup?q=` returns each customer with `bonusBalance`: text like `"4750.00"` while bonus is on, `null` while it is off.
- `GET /customers/:customerId/bonus` returns `{ customerId, enabled, earnPercent, maxRedeemPercent, balance, history }`. Each history row: `{ id, typeCode, amount, occurredAt, note, saleId, createdBy: { id, name } | null }`. `amount` is signed text: positive is points in, negative is points out. `typeCode` is one of EARN, SPEND, RETURN, CORRECTION.
- `POST /customers/:customerId/bonus/adjustments` with `{ amount, reason }`: `amount` is a signed number, not zero, at most 2 decimals; `reason` is 1 to 500 characters. Needs the permission `bonus.adjust`.

Do this:
1. New entity slice `client/src/entities/bonus/` (with `index.ts` and a `README.md`): types, a key factory, a repository, and two hooks, each hook in its own file: `useCustomerBonus(customerId)` (a query) and `useAdjustCustomerBonus()` (a mutation that invalidates that customer's bonus query and the customer lookup queries, through the key factories).
2. `client/src/entities/customer/model/customer.types.ts`: add `bonusBalance: string | null` to the customer type that `/customers/lookup` returns. `entities/customer/ui/CustomerPicker.tsx`: when `bonusBalance` is not null, show the points next to the customer's name. When it is null, show nothing new.
3. New feature slice `client/src/features/adjust-bonus/`: a "Correct points" dialog with an amount (may be negative, not zero, at most 2 decimals) and a reason (required). Form with `react-hook-form` + a `zod` schema in the slice's `model/`. On success close the dialog and show the usual success toast; on failure show the server's message.
4. `client/src/pages/customers/`: a new component in its own file (for example `CustomerBonusPanel.tsx`) inside the customer detail: the balance, then the history (date, type, amount with its sign, note, who). Mount it from `CustomerDetailSheet.tsx` with as few added lines as possible. Show the panel only when the bonus answer says `enabled: true`. The "Correct points" button is shown only to a user with `bonus.adjust`: the page checks the permission and passes it down, the same way `pages/balance` does for `balance.manage`. A feature must not import another feature.
5. Two things that bit part 1, do not repeat them:
   - The React Compiler is on. To read a form value in a component use `useWatch({ control: form.control, name })`, never `form.watch(...)`: with `form.watch` the component does not update.
   - Nothing new may be visible while bonus is off.
6. Text: add the new keys to `client/src/shared/i18n/en/customers.json` and the same keys with the same English text to `client/src/shared/i18n/uz/customers.json`. Do not create a new i18n file. Do not write Uzbek; it is translated later. No raw key may show on screen. The four type names (EARN, SPEND, RETURN, CORRECTION) get a readable label each.
7. A test file next to the schema (`node --test`, same style as `client/src/features/create-price-list/model/create-price-list.spec.ts`), added to the `test` script in `client/package.json`: zero is refused; `-10` and `10.5` pass; `1.234` is refused; an empty reason is refused.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Commit on this branch, adding files by path (never `git add -A`). Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/004-step11-customer-points.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser, so say plainly that the screens were not seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Files changed:
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
- Not done / skipped / failed:

## Check by Claude
