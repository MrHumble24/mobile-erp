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

Progress (updated as each step lands):

| Step | Server | Web | Android | iOS | Notes |
|---|---|---|---|---|---|
| 1 Stores skeleton | merged, pushed | not needed | not needed | not needed | ADR 0023 |
| 2a Ledger core | building | | | | |

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
