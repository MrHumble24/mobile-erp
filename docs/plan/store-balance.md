# Store balance — discussion and decisions

Date: 2026-11-04
Status: DISCUSSING. No code until the user confirms.

## What the client asked

The store has money. Everything the store does spends or earns that money.
Imagine a new store with a starting amount. They buy phones with it, pay
expenses with it, sell phones and get money back into it. The system must
show that balance and every change to it.

## Decided so far

| Question | Decision |
|---|---|
| What is the balance | A ledger: every money in / money out is one row. Balance = sum of rows. |
| Accounts | Two: **cash** and **card**. Each has its own balance. Store balance = both together. |
| Money in | Phone sold (POS or partner settles), partner payment, owner deposit. |
| Money out | Phone bought from supplier, shipment overhead, expense, refund on return, owner withdrawal. |
| Supplier money leaves when | Each phone's acquisition cost when its IMEI is scanned in. Shipment overhead when the shipment is registered or edited. |
| Card money | Counts as the store's money right away. No waiting for the bank. |
| Starting point | Owner types the starting number for cash and for card. Old sales and expenses are **not** backfilled. |
| Below zero | Allowed. Shown in red. Nothing is blocked. |
| Manual entries (owner only) | Starting balance, deposit, withdrawal, correction (with reason). |
| Who picks cash vs card | The cashier at checkout, when logging an expense, when taking partner money. |
| Split payment | A sale may be paid part cash, part card (from CloudShop). One ledger row per part. Refund goes back the same way. |
| Transfer | Owner can move money between cash and card (from CloudShop). |
| Old mobile builds | Server defaults to cash when the account is missing, so old apps keep working. |
| Who sees the balance (2026-11-05) | Owner by default. It is a permission (`balance.read`), so the owner can switch it on for any cashier. |
| Telegram daily digest (2026-11-05) | Yes. It adds opening and closing balance, for cash and for card. |
| Sale price or expense edited later (2026-11-05) | The old ledger row stays. A new row posts only the difference. Same rule as customs fee and phone expense. |

## Waiting on

- [ ] **Customs Excel file** — asked the client on 2026-11-04. When it
  arrives, share it here and check the columns against the proposal in
  Change 2. Do not build the upload before seeing it.
- [x] **cloudshop.ru MD document** — received 2026-11-04 at
  `~/Downloads/project-management-materials/CloudShop Features Guide.md`.
  Read. Findings are in "What we take from CloudShop" below.

- [x] **Shifts answer** — answered 2026-11-05: yes, the cashier counts
  cash at the start and at the end of the day. Shifts are optional (a
  switch). See Change 11.

## Not decided yet

- Nothing open between us right now. Client answers still pending are
  under "Waiting on" and in each change's "Questions for the client".
- "We have more changes" — list them below as they come up.

## Further changes raised by the client

### Change 2 — customs fee per device ("tamozhnya")

What the client said:
- Every phone pays a customs fee. The government sets it, so it differs
  from phone to phone.
- The fee belongs to the phone, not to the shipment.
- If the fee is changed later, past sales and past balance rows stay as
  they were.
- The fees arrive as an Excel file. The system must accept that file.

How it fits what we have today:
- A phone's cost today = price paid to supplier + its share of shipment
  overhead. Customs fee becomes a third part of that cost.
- A sale already freezes the phone's cost at sale time
  (`landedCostSnapshot`). So changing the fee later does not touch old
  sales. This rule already works, we only need to keep it.
- Balance: customs fee is money out. The day the fee is entered, one
  ledger row goes out. If the fee is changed later, only the difference
  goes out (or comes back). Old rows are never edited.

Update from the user: the Excel file has **no IMEI**. The government
lists a model (name, code or number) and the fee for that model. So the
fee is really "per model", and we copy it onto every phone of that model
in the shipment.

Second update from the user: customs gives a **price list**. The store
uploads it once. Every phone then gets its fee from that list. The list
changes maybe every 2 to 3 months; then the store uploads the new one.
Whether storage matters is unknown; the list decides.

Proposed (simpler than before):
- New table: customs price list. One row per model: model, fee, the date
  the list was uploaded. A new upload adds a new version; old versions
  stay for history.
- When a phone is scanned in, the system looks up the current fee for
  its model and stamps it on the phone: `customsFee`. From then on the
  phone keeps that number. A later price list never changes it.
- Phone cost = supplier price + overhead share + customs fee.
- Balance: customs fee goes out at scan-in, together with the supplier
  price.
- Matching the model: the file writes the model the government's way.
  We add a field on our model, `customsCode`, holding that exact text.
  Admin fills it once per model. Upload matches on it. Rows that match
  nothing are listed back after upload so the admin can fix the codes.
- Upload screen: Settings or Shipments area, owner only. Shows the
  current list and when it was uploaded.
- Hand fix: owner can change one phone's fee by hand if the list was
  wrong. Old sales keep their old cost; balance posts the difference.
- If the list turns out to depend on storage, the match becomes
  model + storage. Same design, one more column.

Questions for the client:
1. Can we get one real Excel file from customs? We need the exact
   columns and how the model is written.
2. Phones scanned in before any list is uploaded: **answered
   2026-11-05: allowed.** Scan-in is not blocked. The fee is 0, the
   shipment shows a warning, and the fee is filled later.
3. Customs fee is paid from the store balance like everything else?
   (Assumed yes.)
4. Shipment overhead stays as a separate field for shipping and other
   costs? (Assumed yes.)

### Change 3 — expense per phone inside a shipment

What the client said:
- A batch (shipment) arrives. It has an overall expense.
- On top of that, each phone in the batch can have its own expense.
- The batch's total expense = all of its phones' expenses added up.

Today:
- A shipment has one overhead number. It is spread equally over all its
  phones. There is no per-phone expense.

Decided (user, 2026-11-04):
- There is **no separate batch expense**. Batch A with 10 phones: each
  phone has its own expense, and the batch expense is just those 10
  added up. Nothing else.
- So the shipment-level "overhead" number goes away. It is replaced by
  a per-phone expense. The shipment shows the sum, computed.

Proposed:
- New field on the phone: `unitExpense` (money, default 0). Typed at
  scan-in or later on the phone's edit form.
- Phone cost = supplier price + customs fee + unit expense.
- Shipment page shows the sum of its phones' expenses and the sum of
  their customs fees. Computed, never stored.
- Balance: unit expense goes out when it is entered. Changing it later
  posts only the difference. Sold phones keep the old cost in their
  sale.
- Old shipments that already have an overhead number: keep the spread
  share each phone already has, written into its `unitExpense`, so
  nothing changes for them. Then the overhead field is dropped.

Also decided:
- The expense can be added to a phone **at any time**: at scan-in, a
  week later, after it is sold. No lock. Sold phones keep the old cost
  in their sale; the balance posts only the difference.

Decided (user, 2026-11-05):
- One number per phone plus a short note. No list of lines.
- Who may enter or change it: its **own permission**, separate from
  phone edit rights. Owner has it by default and switches it on per
  cashier.

### Change 4 — customs fee history and trend

What the client said:
- The owner wants to see how the customs fee changed over time. Last
  year it was X, this year it is Y. Shown as a chart or similar in
  analytics.

Why it is cheap:
- Change 2 already keeps every uploaded price list as a new version
  with its date. Old versions are never deleted. That is the history.

Proposed:
- New tab in Reports: "Customs fees". Pick a model, see a line chart
  of its fee over time, one point per uploaded list. Below the chart, a
  table of the same numbers with upload dates.
- Also a "latest vs previous" column on the price list screen, so the
  owner sees at a glance which models went up or down after an upload.
- Mobile apps get the same tab in Reports.

Decided (user, 2026-11-05):
- The average customs fee actually paid per month is **not** in the
  first version. Add later; the data will be there.

### Change 5 — POS with a product catalog (click, not only scan)

What the client said:
- Today the POS only works by typing or scanning an IMEI.
- The client wants a shop-like screen: product cards with pictures,
  the seller taps a card to sell.
- Each model must have its own picture, and models must be distinct.
- Reference: the cloudshop.ru POS. The user will share an MD document
  that summarises its functions.
- Idea with a question mark: phones have a model code (Apple "A2894",
  "MQ9X3" etc). Could the system use that code to find the model and
  picture automatically?

What we have today:
- Every phone in stock is one row with its own IMEI. A sale is always
  tied to one IMEI. That rule must stay: it is what gives warranty,
  returns and profit per phone.
- Models exist (brand + name + specs like storage, color), but have no
  picture and no model code.

Proposed:
- POS gets a second mode next to scan: a grid of product cards. One
  card per model that has at least one phone in stock. Card shows
  picture, model name, how many in stock, price from the target price.
- Tapping a card opens the in-stock phones of that model (storage,
  color, grade, price). Seller taps one; that IMEI goes to the cart.
  If only one is in stock, it goes straight to the cart.
- Model gets a picture field. Admin uploads one picture per model on
  the model admin screen. Stored as a file on the server, not in the
  database.
- Model gets a `modelCode` field (the Apple / Samsung code), filled by
  the admin. Later it can be used to fetch a picture or details from
  the internet, if the client wants that. Not in the first version.
- Search box on top of the grid: by model name, model code, or storage.
- Same catalog mode on the mobile apps.

Free lists for finding a device by its code (checked 2026-11-05 by
downloading each one and reading real rows):

| List | Code you give | What comes back | Size, license |
|---|---|---|---|
| The Apple Wiki, pages `Models/iPhone`, `Models/Mac`, `Models/iPad`... | Box code, e.g. `MU793` | Model, color, storage (RAM too for Macs) | about 3,800 iPhone codes, 1,450 Mac codes. CC BY-SA: we must credit them. Public API at `theapplewiki.com/api.php`. |
| AppleDB (`api.appledb.dev/device/main.json`) | Apple `A` number, e.g. `A3113` | Model name, list of possible colors, picture key | 1,947 entries. MIT. |
| TAC list (`github.com/MoazEb/tac-database`) | First 8 digits of the IMEI | Brand and model. No color, no storage. | 275,864 rows, updated October 2026. MIT. |
| Google Play device list (`storage.googleapis.com/play_public/supported_devices.csv`) | Android model code, e.g. `SM-S918B` | Brand and model name. No color, no storage. | about 54,000 rows. Official Google file, no license stated. |

Checked examples: `MU793` = iPhone 15 Pro Max, Natural Titanium,
256 GB. `MG8M4` = iPhone 17 Pro, Cosmic Orange, 512 GB. IMEI starting
`35982437` = iPhone 15 Pro Max. `SM-S918B` = Galaxy S23 Ultra.

Not found for free: a list that gives **color** for Samsung or Xiaomi
from their code. For those the model comes automatically; color is
picked by hand. Storage for Samsung can be offered as a short list to
pick from (see below).

Downloaded 2026-11-05 into `docs/reference/device-lists/` (see its
README): iPhone X to iPhone 18 Pro Max and iPhone Duo (2,910 box
codes), Samsung S, Note, A and Z series from 2018 (171 models, 948
model codes, RAM and storage sizes per model), and 22,880 IMEI
prefixes for those phones.

Proposed:
- Load these lists into our own tables once, and refresh them from time
  to time. The till never calls the internet for this, so it still
  works offline.
- Scan an IMEI: brand and model fill in by themselves.
- Type an Apple box code: model, color and storage fill in by
  themselves.
- Anything the lists do not know: the admin picks it once, the system
  remembers it.
- No paid service.

Questions for the client:
1. Does the shop also sell things without an IMEI (cases, chargers,
   cables)? If yes, that is a bigger change: a second kind of product
   with quantity instead of IMEI. Please confirm yes or no.
2. Price on the card: **answered 2026-11-05: three prices** (walk-in,
   wholesale, other shops). See Change 12.
3. Pictures: does the client have them, or should we try to fetch them
   by model code? (Proposed: admin uploads for now.)

### What we take from CloudShop (read 2026-11-04)

CloudShop counts items by quantity. We count phones by IMEI. So we copy
the **feel** of its till, not its stock model. Sorted into take, ask,
skip.

**Take (fits the client's words and our plan):**

| CloudShop thing | What it becomes here |
|---|---|
| Tap products on the till, search, scan | Change 5: catalog grid + scan, same cart |
| Pay by cash / card, **split** cash + card | Change 1: a sale can have two payment lines, one per account. Ledger posts one row per line. |
| Cash in / cash out / **transfer** between accounts | Change 1: manual entries + a transfer entry. Answers the open question: yes, transfer. |
| Accounts: store safe, till drawer, bank | Change 1: we keep two, cash and card. More accounts can be added as rows later; it is a lookup table. |
| Refund follows the original payment | Return of a sale refunds to the same account(s) the sale used. |
| Product card: image, code, barcode, category | Change 5: model gets picture + model code. Category = brand for now. |
| Excel import with "matched / will be created" preview | Change 2 upload shows matched / unmatched rows before saving. |
| Money journal (every money in and out) | Change 1: the Balance screen history. |
| Accounts report: in, out, balance per account | Change 1: Balance screen summary. |
| Daily email report | We already have the Telegram daily digest; add opening/closing balance. |
| Cashier rights: show cost, show purchase price off by default | We already do this with permissions. |

**Ask the client (CloudShop has it, we do not; each is real work):**

| CloudShop thing | Question |
|---|---|
| Shifts: open with cash count, close, shift report | Does the client want shifts per cashier? Or is one store balance enough? |
| Credit sale to a customer (Отсрочка), customer debt, debt repayment | Today nasiya is only with partner shops. Do walk-in customers also buy on credit? |
| Discounts: on product, per customer, cashier presets | Today the seller types the final price. Is that enough, or does the owner want fixed discount rules? |
| Products without IMEI (cases, chargers), sold by quantity | Same question as before. Yes or no? Big change if yes. |
| Receipt printer, price tags | Do they print receipts? We have a receipt page; do they need thermal print? |
| Loyalty bonuses | Probably no. Confirm. |

**Skip (Russia-specific or out of scope):**
kits, weighed goods, Честный знак tracking, Russian fiscal devices and
forms, online store, Evotor and bank terminal integrations.

Answers from the user, 2026-11-04 (client's words relayed):

| Question | Answer |
|---|---|
| Shifts | **Not answered yet.** Asked the client, waiting. |
| Customer credit | Yes. Walk-in customers may pay later, "in the Islamic way". See Change 6. |
| Discounts | Yes. Configurable in settings: percent or fixed amount, all options. See Change 7. |
| Things without IMEI | Yes, big. Cases, chargers, cables, protectors by quantity. Also consoles and other devices tracked by serial number. See Change 8. |
| Multi-store | Yes. One owner, many branches. Not multi-tenant. See Change 9. |
| Printing | Build it, but let each shop turn it on or off. |
| Bonus points | Build it, but let each shop turn it on or off. |

Bigger picture from the user: the client wants this to become a **full
solution they can sell to other shops in Malika Bazaar**. So every
optional feature (printing, bonuses, discounts, shifts) must be a
switch in settings, off by default, not hard-wired.

### Change 6 — customer credit, Islamic way

What the client said: a walk-in customer may take the phone and pay
later. "Islamic way" means no interest: the price is agreed once, the
customer pays it in parts, nothing is added for being late.

Proposed:
- At checkout, a third way to pay next to cash and card: **credit**.
  Seller enters the agreed total, the down payment now (cash or card),
  and a payment plan (number of parts, due dates). Customer must be a
  named customer with a phone.
- The sale is recorded now; the device is SOLD. The unpaid part is a
  customer debt. Each later payment is taken at the till, picks cash or
  card, and posts to the ledger.
- Customer page shows debt, plan, paid, overdue. Reports get a
  "customer nasiya" view like the partner one. Telegram alert on
  overdue.
- No interest field anywhere, no late fee field anywhere. On purpose.
- Switch in settings: "allow customer credit", off by default. Also a
  permission so the owner decides which cashiers may sell on credit.

Also decided (user, 2026-11-04):
- Owner can set a maximum credit per customer. Default limit in
  settings, override on the customer card.
- There is a paper contract. We print it: a template with store,
  customer, phone, price, plan and due dates.

### Change 7 — discounts

Proposed:
- Checkout gets a discount box per line and for the whole sale. Mode:
  percent or fixed amount. Final price = list price − discount.
- Settings: discounts on/off; allowed modes; up to 5 preset values
  (like CloudShop's cashier presets); max discount a cashier may give
  without the owner; a per-customer standing discount on the customer
  card.
- Sale stores both the list price and the discount, so reports can show
  "given away in discounts".

### Change 8 — products without IMEI (quantity items and serial items)

This is the biggest change. Today one stock row = one phone with an
IMEI. We add two more kinds of product:

| Kind | Example | How stock is counted | Sold by |
|---|---|---|---|
| IMEI item (today) | phone | one row per unit, IMEI | scan or tap |
| Serial item (new) | console, laptop, watch | one row per unit, serial number | scan or tap |
| Quantity item (new) | case, cable, charger | one number per product per store | tap, pick quantity |

Proposed:
- One **product catalog** for all three kinds: name, picture, brand,
  category, code, barcode, sale price, kind. Today's "device model"
  becomes a product of kind IMEI.
- IMEI and serial items share the same unit table (today's devices),
  with the identifier column renamed to "serial" and a flag for which
  kind. Everything that works for phones (QC, warranty, consignment,
  returns, history) works for serial items with no extra code.
- Quantity items get a stock table (product × store × quantity) and a
  stock movement log (purchase in, sale out, return in, write-off,
  transfer between stores, stock count correction).
- Purchases of quantity items: a shipment can hold quantity lines too,
  with unit cost. Cost per unit: the user does not know yet. Proposed
  default: **moving average** (what CloudShop does, and what most
  shops expect). Ask the client only if they disagree later.
- Checkout cart mixes all kinds. Receipt, ledger, reports follow.
- Barcode: quantity items get an EAN barcode field, so a scanner adds
  them to the cart like CloudShop.

### Change 9 — many branches (multi-store)

What the client said: the owner creates as many stores as they want.
One company, many branches. Not many companies.

Proposed:
- New table: stores. Every stock row (phone, serial item, quantity
  stock), every sale, every expense, every ledger row, every shipment
  carries a store id.
- Cash and card accounts exist **per store**. Store balance per store,
  and a company total.
- Transfer of stock between stores: a document that moves units or
  quantities, with history.
- Users are assigned to one or more stores. A cashier sees only their
  store. The owner sees all, with a store picker at the top.
- Reports: filter by store or see all.
- Offline sync and IMEI locking already exist; they get a store id
  too.

### Change 10 — online storefront (MVP 1)

What the client said: customers can look at what is in stock on a
public web page. They cannot pay. They can leave an order.

Decided by Claude (user said "decide yourself"): the storefront shows
**all branches together**. Each product shows which branch has it.
A customer who leaves an order picks the branch for pickup. Reason: a
buyer in Malika Bazaar wants to know "do you have it", not "which
branch"; hiding other branches loses sales.

Proposed:
- Public page, no login, under the shop's own address or
  `shop.<domain>`. Switch in settings: storefront on/off, which
  categories to show, show price or "ask", contact phone and Telegram.
- Shows products that are in stock: picture, name, storage/color
  variants, price, branch(es). Phones show count only ("3 in stock"),
  never IMEIs.
- Order form: name, phone, product, branch, note. No payment.
- An order lands in the ERP as a new "orders" list with status new /
  contacted / done / cancelled. Telegram alert to the owner on each new
  order. Staff call the customer and sell at the till as usual, linking
  the sale to the order.
- Nothing is reserved automatically. Reserving stock can come in MVP 2.
- Same list on mobile apps (read + change status).

Later (MVP 2+): online payment, reservations, delivery, customer login.

### Change 11 — shifts (optional)

What the client said (2026-11-05): the cashier counts the cash at the
start of the day and at the end of the day. Shifts are optional.

Proposed:
- Switch in settings: "shifts", off by default.
- When on: the cashier opens a shift and types the cash counted in the
  drawer. At the end they close it and type the cash counted again.
- The system knows what the cash should be (opening count + cash in −
  cash out during the shift). It shows expected, counted and the
  difference. A difference is saved with the shift, never hidden.
- Shift report: sales, refunds, expenses, cash in and out, card total,
  difference. The owner sees all shifts in a list.
- While shifts are on, selling needs an open shift.
- Card money is not counted by hand; only cash.

Decided (user, 2026-11-05):
- One shift **per cashier**. Each cashier opens and closes their own
  and counts their own cash.

- A difference at closing is **posted to the balance** as a correction
  row, so the balance always matches the real cash. It also stays
  visible in the shift report.

### Change 12 — three prices

What the client said (2026-11-05): the POS needs three prices: for a
walk-in customer, for wholesale, and for other shops.

Today:
- Each phone has one `targetPrice`. The seller types the final price at
  checkout. A phone given to a partner shop has its own agreed price.

Proposed:
- Three price levels: **retail** (walk-in), **wholesale**, **partner**
  (other shops). A lookup table, so a fourth level can be added later
  without a rebuild.
- At the till the seller picks the level (or it follows the customer).
  The cart fills in that price. Discounts (Change 7) apply on top.
- Giving a phone to a partner shop offers the partner price as the
  agreed price.

Decided (user, 2026-11-05):
- The three prices are set on the **product** (model + storage). A
  single phone can have its own three prices when it differs, for
  example a lower grade. The phone's price wins when it is set.
- The level **follows the customer**: each customer has a type
  (walk-in, wholesale, shop). No customer chosen means walk-in. The
  seller can switch the level by hand.
- The cashier cannot type a free price. Lowering the price is a
  **discount** (Change 7), so the owner's discount limit applies and
  reports show what was given away.

### Change 13 — repairs

Why: on 2026-11-05 we compared ours with other phone shop systems
(CellSmart, RepairDesk, HisabPlus). They all have repairs. The user
confirmed: yes, the shop repairs phones.

Proposed:
- A repair ticket: customer, phone (model, IMEI if known), what is
  broken, agreed price, who repairs it, status (received, in repair,
  ready, given back, cancelled).
- Parts used come out of quantity stock (Change 8).
- Payment is taken at the till, cash or card, and posts to the balance.
- The customer gets a paper or a message with the ticket number.
- Switch in settings, off by default.

Decided (user, 2026-11-05):
- **Both ways.** The shop's own master can fix it, or the phone is
  sent to an outside master. The ticket says which. For outside
  repairs the ticket also holds what the shop pays the outside master;
  that money goes out of the balance.
- **Repairs have a warranty.** The warranty period is typed on each
  ticket. There is no fixed period in settings.

### Change 14 — buying used phones from customers (trade-in)

The user confirmed on 2026-11-05: yes, the shop buys used phones from
walk-in customers.

Today: a phone enters stock only through a supplier shipment.

Proposed:
- A second way in: "bought from customer". Record the customer, the
  IMEI and the price paid. Money goes out of the balance. The phone
  enters stock and goes through the usual check and grading.
- Trade-in at the till: the customer gives an old phone as part of the
  payment. Its value lowers what they pay. The old phone enters stock
  the same way.

Decided (user, 2026-11-05):
- **No passport.** Storing passport data is illegal here. We never
  store a passport number or a passport photo, anywhere in the system.
- We store the seller's other details: name and phone number.

### Change 15 — tax receipts (optional)

The user said on 2026-11-05: optional.

Proposed:
- A switch in settings, off by default. Nothing is designed until a
  shop asks for it. Then we learn what the tax system needs and connect
  to it.

### Change 16 — backup and restore, with storage providers

What the user said (2026-11-06): the system needs full backup and restore
management. Backups must be sent to different places such as Google Drive,
Microsoft OneDrive or Telegram, built as an adapter pattern so more places can
be added, and set up from Settings.

How it fits what we have: the PRD already asks for daily encrypted database
backups. This adds the places to send them, the restore, and the settings
screen.

Decided by Claude as defaults (the user can change any): the backup holds the
whole database and the pictures, for the whole company; it is always
encrypted before it leaves the server; the owner types a passphrase once in Settings and must keep it safe; logins to Drive, OneDrive and Telegram are stored encrypted and
never shown; made by hand and every day at a chosen time; the last 14 are
kept per place; owner only; a restore is all or nothing, makes a safety
backup first, and asks for the shop's name and the owner's password.

Status: built and merged on 2026-11-06 (row 13 in the progress table). The handoff is
`docs/handoffs/gemini/023-backup-and-restore.md`. Everything not started is
listed in `docs/plan/backlog.md`.

### Change 17 — first-boot setup, in-app configuration, branding, themes

What the user said (2026-11-06): the system will be sold to other shops, so
when it starts for the first time it must walk the owner through a setup.
Most configuration must be done inside the app, not in env files. The shop
must be able to set its own logo and other details. A few ready-made themes
to choose from would be great.

What is typed into the code or the env today: the first owner, the Telegram
bot token, the name "Malika", the dollar sign, and most colors.

Decided by Claude as defaults (the user can change any): only the database
address, the port and the data folder stay in the environment; secrets are
typed in the app and stored encrypted; the setup needs a one-time code that
the server prints on first boot, so a stranger cannot take over a fresh
install; name, logo, currency, time zone, language and theme belong to the
company, branch details stay per branch; one currency per company; logo as
PNG, JPG or WebP; four ready-made themes, one for the whole shop, no color
editor yet; phone apps later.

Status: backlog. The handoff is
`docs/handoffs/gemini/024-onboarding-branding-themes.md` (five parts).

Change 16 (backup and restore) was started on 2026-11-06 on the user's word,
built by Opus 4.8 and checked by Claude; its backup passphrase and provider
logins follow the same "in the app, encrypted" rule.

### Change 18 — danger zone: erase the shop's data

What the user said (2026-11-06): one feature, a danger zone. It should
clean up everything inside the app, but it should warn us.

Decided by Claude as defaults (the user can change any): it always erases
what the shop did (sales, stock, money, repairs, orders, points); the owner
may also tick "customers, partners, suppliers" and "the product catalog";
it never erases users, branches, settings, saved logins, backups or the
lists the system needs; a safety backup is always made first, so an erase
can be undone by restoring it; the owner types the shop's name and their
password and ticks "I understand"; owner only; everyone is signed out
afterwards. Going back to the very first start (also erasing users and
settings) waits for the setup wizard.

Status: being built by Opus 4.8, run and checked by Claude. The handoff is
`docs/handoffs/opus48/002-danger-zone.md`.

## Order of work (proposal, for discussion)

Everything above depends on the ledger and the product catalog. The
safest order:

1. Stores table + store id on every stock and money row (Change 9
   skeleton only: one store, no picker, nothing visible). Doing this
   first means the ledger is born with a store id.
2. Ledger with accounts per store (Change 1), split payment, transfer.
3. Per-phone expense and customs fee, Excel upload (Changes 3, 2, 4).
4. Product catalog with three kinds, quantity stock (Change 8).
5. POS catalog mode with pictures (Change 5).
6. Discounts, customer credit, bonuses, printing, each behind a switch
   (Changes 7, 6, and the optional ones).
7. Online storefront MVP 1 (Change 10). Needs the catalog with
   pictures (step 4) and branches (step 1).
8. Shifts (Change 11). Needs the ledger (step 2).

9. Buying phones from customers and trade-in (Change 14). Needs the
   ledger (step 2).
10. Repairs (Change 13). Needs quantity stock for parts (step 4).
11. Tax receipts (Change 15), only when a shop asks.

Three prices (Change 12) go with step 4 or 5, where products and the
POS card are built. The device lookup lists
(`docs/reference/device-lists/`) are loaded in step 5.

Decided by Claude, 2026-11-06 (user: "I don't know"): a phone sold by one
branch and bought back by another branch goes into the stock of the branch
that bought it. The phone is physically there, and that branch paid for it.

Branches (Change 9) are built and merged for the server and the website
(2026-11-06, row 12 in the progress table). Phone apps are next.

Full branches (the rest of Change 9: store picker, users per store,
moving stock between stores) are built when the client opens a second
branch, and at the latest before the storefront (step 7).

Steps 8 and 9 (shifts, buying from customers) only need the ledger.
They can move up, right after step 3, if the client wants them sooner.

This is several months of work across server, web, Android and iOS. It
also changes `docs/PRD.md` in many places; the user owns that file.

## Where we start (build plan, 2026-11-05)

Status: **Step 1 DONE.** Confirmed by the user on 2026-11-05, built,
checked and merged into `main` the same day (merge `010f1e3`, ADR
0023). Not pushed yet. Still owed by the user: the "Store Structure"
row in PRD section 1.
**Step 2 started on 2026-11-05** (user: "you will build other things"
while Gemini does the data). Part 2a, the ledger core on the server,
is being built on branch `agent/backend/ledger-core`.
Steps 3 and later are still proposals; each needs its own "confirmed".

Gemini handoff 015 (device lists) came back on 2026-11-05. Checked
against the sources: iPad, Mac, Watch and AirPods box codes are exact.
Samsung colors, pictures and the hand-typed RAM/storage rows were not
trustworthy, so Claude cleaned them the same day:
- colors are now `samsung-color-suggestions.csv`: only rows found on
  the page they cite, to be used as a pick list, never as the truth;
- pictures: 71 of 192 kept (file name must name the exact model);
- RAM/storage: hand-typed rows carry a `note`.
The README in `docs/reference/device-lists/` says how far to trust
each file. Read it before loading anything into the database.

GSMArena (looked at 2026-11-05, `github.com/nordmarin/gsmarena-api`):
its phone pages have exactly what we lack for Samsung: colors per
exact model, RAM + storage pairs, model codes. The library read one
page fine, then the site blocked further requests ("Too Many
Requests"). The data belongs to GSMArena, not to the library.
Decided by the user on 2026-11-05: read it once, slowly, for Samsung
colors and memory sizes only. Given to Gemini as handoff 016.
Result: GSMArena blocked this computer for 10 hours on the first
request, so nothing was collected yet. The scripts are ready; run them
after 2026-11-05 20:30. Until then the "suggestions" files are used.

### Night build (user, 2026-11-05 evening)

The user said: "Step by step build all the features which we
discussed", then went to sleep. So every step below is confirmed, and
Claude works through them in order without asking.

Rules Claude follows while the user is away:
- Same path for each step: server, then web, then Android and iOS,
  with the checks, then merge into `main` on this computer.
- **Nothing is pushed.** Pushing deploys to Railway; that waits for the
  user.
- Uzbek texts are left as English placeholders and collected into a
  Gemini handoff. The PRD is not touched; its text is written here.
- Where a decision is missing, Claude takes the option it recommended,
  writes it under "Decisions taken while the user slept", and goes on.
- A step that cannot be finished properly is left unmerged and listed
  under "Progress", with the reason. No half-working code goes into
  `main`.

Decisions taken while the user slept:
- Part 2b, who pays when nobody picks: the person registering a
  shipment picks cash or card for that shipment (its phones and its
  overhead). A repeating expense keeps the account on its template.
  Both default to cash.
- Customs fee: the Excel upload is **not** built until the client's
  file arrives (the plan already says so). The fee list can be typed
  in by hand meanwhile.
- Tax receipts (Change 15): no switch is added. The plan says nothing
  is designed until a shop asks; a switch that does nothing would only
  confuse.
- Bonus points: one point is one unit of money. The shop sets how much
  of a payment comes back as points and how much of a sale may be paid
  with points. Points are spent online only.
- A trade-in on a sale: when that sale is returned, the traded-in
  phone stays with the shop and its value is paid back in cash.

Progress (updated as each step lands):

| Step | Server | Web | Android | iOS | Notes |
|---|---|---|---|---|---|
| 1 Stores skeleton | merged, pushed | not needed | not needed | not needed | ADR 0023 |
| 2a Ledger core + Balance screen | merged (`025f060`) | merged, clicked through in a browser, one bug fixed (`31afa82`) | merged, seen running on an emulator, raw-text-keys bug fixed (`6401e48`) | merged, seen running on a simulator, large-text fix (`c0967ec`) | ADR 0024. Both phone apps gained or are gaining a debug-only sign-in for screenshots. |
| 2b Automatic posting, cash/card choice, split payment | merged (`4003240`), live API checked | merged (`29745a4`); a two-phone split sale done in a browser and confirmed on the server | merged (`21bb957`), seen running on an emulator, builds and tests pass from `main` | merged (`27fc671`), seen running on a simulator, builds from `main` | ADR 0025. Split works for a cart with several phones: the cart total is split, each phone is paid from cash first, then card. |
| 2c Telegram: opening and closing balance | merged (`542afcf`) | not needed | not needed | not needed | English text for now. |
| 3 Expense per phone, customs fee from a price list, fee history | merged (`542afcf`, 283 tests), walk-through matched a hand calculation | merged (`0fbfccc` + polish `df6bfef`); clicked through in a browser | merged (`c9db2e2`), seen on an emulator; a shipment saved through the app; builds and tests pass from `main` | merged (`4746e3d`), seen on a simulator; builds from `main` | ADR 0026, 0027. Shipment overhead is gone. No Excel upload until the client's file arrives; the list is typed in. |
| Security fixes for the ledger | merged (`542afcf`) | part of step 3 work | part of step 3 work | part of step 3 work | ADR 0028. Refund capped; cost amounts hidden in history without the cost permission. |
| 4a Product kinds, categories, serial-number items | merged (`97bb28a`, 317 tests) | merged (`4c3d82b`); a serial unit added to the till cart by typing its serial in a browser | merged (`ae995ce`); a console sold by serial number on an emulator and confirmed on the server; builds and tests pass from `main` | merged (`9cddb0d`); a console sold by serial number on a simulator and confirmed on the server; builds from `main` | ADR 0029, 0032. Change 8, first half. Tables are not renamed: a model is a product, a device is a unit. |
| 4b Quantity items (cases, cables) | merged (`ec8e3ff`, 341 tests), walk-through matched hand calculations | merged (`4dbedb8`); in a browser: 2 cables and a console sold in one cart, split cash and card, confirmed on the server (stock 43 to 41) | merged (`31d63bf`); a mixed split sale and a return made on an emulator and confirmed on the server; builds and tests pass from `main` | merged (`2f52bd4`); a mixed split sale made on a simulator and confirmed on the server; builds from `main` | ADR 0030, 0033. Change 8, second half. Stock is kept like the money ledger: one row per movement. Stock may go below zero. |
| 5 Till catalog with pictures, code lookup from the reference lists | merged (`4273b63`, 372 tests); lists loaded locally (4,631 Apple box codes, 22,880 IMEI prefixes) | merged (`2c4b127`); Catalog mode clicked through in a browser (cards, unit picker, cart); one bug fixed (`af1cceb`: a split from the last sale carried over to the next cart) | merged (`01c5c70`); a phone and a cable picked from the catalog were sold on an emulator and confirmed on the server; builds and tests pass from `main`. Adds one library (Coil) to load and cache pictures. | merged (`99f93e0`); a phone and a cable picked from the catalog were sold on a simulator and confirmed on the server; builds from `main`; grid and cart side by side on iPad | ADR 0031. Change 5. Pictures are files on the server: on Railway they need a volume or they vanish on each deploy. After a deploy run `pnpm ref:import` once to load the lists. To improve later: on a wide screen the cart sits below a long grid; it should sit beside it. |
| 6 Three price levels and discounts | merged (`a1ddebe`, 400 tests), walk-through matched its arithmetic | merged (`61678ab`); the till with price level, discounts and the cart beside the grid seen in a browser | merged (`5f25ea9`); a wholesale sale with a 50 discount made on an emulator and confirmed on the server; builds and tests pass from `main`. The cashier's discount limit is checked by unit tests only (the test login is the owner, who has no limit) | merged (`7c16014`); a wholesale sale with a 3% discount made on a simulator and confirmed on the server. It did not build from `main` at first (two README files clashed in the app bundle); fixed (`23df65c`), builds now | ADR 0034. Changes 12 and 7. Discounts are a setting, off by default. A cashier cannot type a free price once a list price exists; a shop that has set no prices works as before. An offline sale is never rejected for its price: the till is trusted there. |
| 7 Customer credit without interest | merged (`437f412`, 423 tests), walk-through matched its arithmetic; no interest, late-fee or penalty field anywhere. One bug found in the browser and fixed (`822c6de`): the down payment was counted as paying the first part of the plan | merged (`4dacafc`); in a browser: a cable sold on credit (10,000 down, two parts of 10,000), a payment taken, the contract page and the report tab seen. Two fixes (`d9e66b7`): the cart line stays visible on a short screen, and new permissions load without signing out | merged (`6613944`); a credit sale and a payment, and a shift opened and closed with a difference, done on an emulator and confirmed on the server; builds and tests pass from `main`. Two leftovers given to the next Android step: the shift bar shows the opening time in UTC, and the credit plan screen with a customer was not seen | merged (`32c849b`); a credit sale and a payment, and a shift with a −20,000 difference, confirmed on the server; builds from `main`. The credit payment sheet was not photographed | ADR 0035. Change 6. A setting, off by default, with its own permission and a credit limit. Online only. Returning goods bought on credit lowers the debt; no cash is handed back by the return itself. |
| 8 Shifts | merged (`53c42d1`, 445 tests), walk-through matched its arithmetic (expected 11,500,000, counted 11,480,000, difference −20,000 posted) | merged (`a514688`); in a browser: shift opened with 500,000, two cash sales of 30,000, expected 560,000, counted 550,000, difference −10,000 on the report and in the list. Two fixes (`38d23bf`): the close dialog showed the expected cash from before the last sales; the till catalog did not refresh stock after a sale | merged with step 7 (`6613944`) | merged with step 7 (`32c849b`) | ADR 0036. Change 11. A setting, off by default. One shift per cashier; the closing difference is posted to the balance. While the setting is on, a sale without an open shift is refused; offline sales sent later are let through. |
| 9 Buying phones from customers, trade-in | merged (`20b9233`, 465 tests), walk-through matched its arithmetic. One fix (`2078adf`): when a sale with a trade-in is returned, the trade-in part is paid back in cash, not from the card account | merged (`e604e59`); in a browser: the Purchases page and the Buy a phone dialog seen; a trade-in added to the till cart lowered the amount to pay (6,500,000 − 1,000,000 = 5,500,000). Then the sale was made: receipt shows 6,500,000, trade-in −1,000,000, paid 5,500,000 cash | merged (`16759fc`) | merged (`c0d2a4b`) | ADR 0039. Change 14. No passport data anywhere: name and phone only. A phone we sold before cannot be bought back yet (its IMEI is already in the system); to add later. Online only. |
| 10 Repairs | merged (`86293fc`, 495 tests), walk-through matched its arithmetic (ticket 500,000, parts 60,000, profit 440,000; outside master 150,000 paid out) | merged (`1402f53`); in a browser on an outside-master ticket: marked ready, giving back while money was owed asked for a reason, 300,000 taken in cash, given back; profit showed 180,000 (300,000 − 120,000 paid to the master) | merged (`16759fc`) | merged (`c0d2a4b`) | ADR 0040. Change 13. A setting, off by default. Own or outside master, parts from stock, deposit and final payment, warranty typed on each ticket. No passcode or ID document is stored. |
| 11 Bonus points, printing switches, buying back a phone we sold | merged (`f9b6307`, 520 tests) | merged in seven parts through OpenCode (handoffs 003 to 009, last merge `d36d225`), each checked by Claude in a browser: settings switches, the customer's points, paying with points, points on the receipt and reports, receipt printing with the shop's real name, price tags, refusals shown by code. ADR 0047. Texts are English in the Uzbek files until Gemini translates them | not started | not started | Bonus points and printing are switches, off by default. Buying back closes the gap noted in step 9. |
| 12 Branches (many stores, users per store, stock transfers) | merged (`7b430f1`, 567 tests). Built by Gemini (handoffs 018, 019, 021), checked by Claude: live attack tests (a cashier of one store cannot sell, return or push a sale into another), two security passes | merged with the server; seen in a browser: store switch, all-stores balance (the rows add up), a transfer sent from Main store and received in Branch 2 | not started: the apps do not send the store yet, so a user of two stores gets an error there | not started | ADR 0045, 0046. Change 9. The main test database is `mobile_erp_main`. PRD text for branches is still owed. |
| 13 Backup and restore, with storage places | merged (`5fdd123`, 648 tests). Built by Opus 4.8 (handoff 023), run and checked by Claude: two live restores on throwaway databases, three security passes, two fix rounds | merged with the server; the Backups page seen in a browser | not started | not started | ADR 0051, 0052, 0056. Change 16. Telegram, Google Drive and OneDrive were tested against fake servers only: the user must try each once. The data folder must survive a redeploy. One server process only. |
| 14 Danger zone: erase the shop's data | merged (`2419fd98`). Built by Opus 4.8 (handoff opus48/002), checked by Claude | merged with the server | not started | not started | |
| 15 Online storefront (Change 10) | merged (`f7bfcc6d`, 709 tests). Built by Gemini (handoffs 022, 025), checked by Claude: live tries as a stranger, two security audits. One fix by Claude: paging after the stock filter | merged with the server; raw colors replaced by tokens | not started | not started | |
| 16 First-boot setup, company profile, themes (Change 17) | merged (732 tests). Built by Gemini (handoffs 024, 026), checked by Claude: wizard run on an empty database, upgrade of a working database, security audit | merged; the two dark themes are switched off until OpenCode 011 and Gemini 028 | not started | not started | |

Security check of the balance ledger (2026-11-05, read-only): no
critical problems. Two serious ones, both being fixed on the server
branch now:
- A return could refund more than the sale took in. It will be capped
  at what was paid.
- A cashier given "see the balance" could read phone purchase costs in
  the history. Those amounts will be hidden from anyone without the
  cost permission.
Also being fixed: two edits of the same expense at the same moment
could leave the balance wrong; and oversized amounts gave a server
error.
Checked and fine: every money row is written together with its sale,
expense or payment; nothing can edit or delete a ledger row; split
payments must add up exactly; a replayed offline sale posts once.

Second security check (2026-11-05, read-only), over prices and
discounts, customer credit, shifts, buying phones and trade-in:
- **Critical, being fixed in step 11:** a cashier could type a made-up
  trade-in value on a sale, then return the sale and take that value
  out of the drawer in cash. Fix: a trade-in on a sale, and paying its
  value back on a return, need the "buy phones" permission
  (`purchase.create`), which cashiers do not have by default.
- **Serious, same fix:** a trade-in put a phone into stock at any cost
  with only the selling permission.
- **Medium, being fixed in step 11:** two credit sales to one customer
  at the same moment could both pass the credit limit.
- Known and accepted: a sale made offline is trusted for its price; a
  cashier may pick the price level (walk-in, wholesale, shops).
- Checked and fine: the server ignores a price sent by the till when
  online; discount limits; shift rules; no passport or ID field
  anywhere; ledger rows cannot be edited or deleted.

Notes for the user:
- New permissions on the web: fixed on 2026-11-05 (`d9e66b7`). The web
  app now re-reads the user's permissions each time it loads, so a
  page refresh is enough. Before, people had to sign out and in again.
  The phone apps still read permissions at sign-in only.
- Railway does not run the seed on start. After a push, run
  `pnpm prisma db seed` against the Railway database, or the new
  accounts and the `balance.*` permissions will be missing there.

### Before any code

1. **No real data yet** (user, 2026-11-05). The database on Railway
   holds only test data. So no backup is needed, and we may change or
   reset the database freely. This stops being true the day the shop
   starts using the system for real.
2. **PRD.** None of the 15 changes is in `docs/PRD.md` yet, and only
   the user edits that file. For each step Claude writes the PRD text;
   the user pastes it in.
3. **Assumed:** each shop that buys the system gets its own copy
   (own server, own database). Not one shared system for many
   companies. Say so if this is wrong; it changes step 1.

### How every step is built

Same path each time, so nothing is skipped:

1. Server first (`backend` agent, own branch).
2. Web (`frontend` agent).
3. Android and iOS, at the same time.
4. Uzbek texts: a handoff for Gemini.
5. Checks: `prd-guardian` on the change; `security-auditor` when money
   or permissions are touched.
6. Merge, then release.

No one uses the web or mobile apps for real yet (user, 2026-11-05).
So the server and all apps are updated together, and we do not spend
effort keeping old app versions working. This overrides the "Old
mobile builds" row in "Decided so far". It stops being true the day
the shop starts real use.

### Step 1 — stores skeleton (small, server only)

What is built:
- A `stores` table with one store in it, made from today's store
  settings.
- Every phone, shipment, sale, return, expense, partner handover and
  partner payment gets a store id that points to that one store. Old
  rows are filled in by the migration. New rows are filled in by the
  server.

What the shop sees: **nothing changes.** No new screen, no new button.

Not in this step: store picker, a second store, users per store,
moving stock between stores.

Done when: the migration runs clean, every row has a store, all tests
pass.

### Step 2 — store balance (Change 1)

Built in three parts. The shop gets it only when all three are done,
because a balance that misses the sales would show a wrong number.

- **2a. Ledger core.** Cash and card accounts. The owner types the
  starting numbers. Deposit, withdrawal, correction, transfer between
  cash and card. Balance screen with totals and history. Permissions
  `balance.read` and `balance.manage`.
- **2b. Everything posts to the ledger.** Sale, return, expense,
  partner payment, phone scanned in. Cash or card is picked at
  checkout, on an expense and on a partner payment (old apps: cash).
  A later edit posts only the difference.
- **2c. Split payment and Telegram.** A sale paid part cash, part
  card. The daily message shows opening and closing balance.

Then web, Android, iOS, Gemini texts, the two checks, merge, release.

Notes for part 2b (from the PRD check, 2026-11-05):
- A phone sold through a partner shop brings money in **when the
  partner pays**, not when the handover is settled. Posting on both
  would count the money twice (ADR 0008). So "money in" is: POS sale,
  partner payment, owner deposit.
- Money for a supplier purchase and shipment overhead uses the cost
  rules of ADR 0006; an overhead edit posts only the difference.
- A replayed offline sale must not post twice (ADR 0007).
- Open: which account pays when nobody is there to pick: supplier
  purchase at scan-in, shipment overhead, and expenses made
  automatically from a recurring template?

### PRD text for the store balance (for the user to paste)

New part in section 4, Module 5, after the expense tracker:

> **Store Balance (Cash & Card Ledger)**
> - Each store holds two accounts, **Cash** and **Card**. Every money
>   movement is one immutable ledger row (account, type, signed amount,
>   source, date, user, note). A balance is the sum of its rows and is
>   never stored; rows are never edited or deleted — a later change
>   posts only the difference. Card counts as store money immediately.
>   Balances may go negative (shown in red); nothing is blocked.
> - **Money in:** retail sale, partner payment, owner deposit, starting
>   balance. **Money out:** supplier purchase (posted per device at
>   IMEI intake), shipment overhead (at shipment registration/edit),
>   expense, refund on a return, owner withdrawal.
> - **Owner-only manual entries:** starting balance per account,
>   deposit, withdrawal, correction (reason required), transfer between
>   Cash and Card.
> - The ledger starts from the owner-typed starting balance; past sales
>   and expenses are not backfilled.

Section 2, roles: Store Owner gets "Store balance management
(`balance.manage`) and balance view (`balance.read`)". Cashier: "May
view the balance only if granted `balance.read`; selects Cash or Card
at checkout, on an expense, and on a partner payment."

Section 4, Module 3 (checkout and returns): "The cashier selects the
payment account; a sale may be split part Cash, part Card, posting one
ledger row per part. A refund returns to the same account(s) as the
original sale."

Section 4, Module 4: "Partner payments select Cash or Card and post to
the store balance."

Section 4, Module 6, Daily Closing Digest: add "Opening and closing
balance, per account (Cash, Card)."

Section 5, Offline-First: "A queued sale carries its chosen
account(s). Ledger rows post server-side when the mutation applies."

### Step 3 — next

Per-phone expense first (Change 3): it needs nothing from the client.
Customs fee (Change 2) follows; its upload screen waits for the Excel
file.

### Running at the same time

- Gemini: device lists, handoff 015 (open now).
- Nothing else on the server while step 1 is being built. Two changes
  to the database at once would collide.

## Proposed shape (for discussion, not final)

- `cash_accounts` lookup: `CASH`, `CARD`.
- `cash_transaction_types` lookup: `SALE`, `REFUND`, `PARTNER_PAYMENT`, `PURCHASE`, `OVERHEAD`, `EXPENSE`, `OPENING`, `DEPOSIT`, `WITHDRAWAL`, `CORRECTION`.
- `cash_transactions`: account, type, signed amount, link to source row, date, user, note.
- Each existing write path posts its ledger row in the same DB transaction. Reversals post a negative row, nothing is deleted.
- New permissions `balance.read`, `balance.manage`, and one for the
  per-phone expense (e.g. `device.expense`; exact code picked when
  building).
- New Balance screen on web, Android, iOS.
- Breaking: checkout, expense and partner payment requests gain an `account` field.
