# 031 — One Uzbek pass: everything that is still English

Status: merged · Owner: Gemini (Antigravity)

## Why
Claude and OpenCode never write Uzbek, so each feature they built left English text in the `uz`
files. The website and both phone apps read the same files, so one pass fixes all three.
This also closes the old handoff 013 (offline sync) and the never-written 014 (phone strings).

Facts checked by Claude on 2026-11-06:
- 110 keys have the same text in `en` and `uz`: customers 23, repairs 28, pos 18, settings 10,
  inventory 8, setup 7, sales 4, purchases 3, reports 3, sync 2, and one each in backups,
  orders, shifts, storefront. The script `client/scripts/i18n-untranslated.mjs` lists them.
- Six keys the phone apps call do not exist in any file, so the phones show the raw key:
  `common.loadMore`, `common.clear`, `common.offline`, `inventory.selectDevice`,
  `shipments.selectShipment`, `qc.dateRange`.
- The Uzbek for backups and the danger zone was written by Claude models, not by a native
  speaker. It has never been read by one.

=== MESSAGE ===
Translate into Uzbek every text that is still English in the app, and read over the Uzbek that machines wrote. You may edit only `client/src/shared/i18n/**` and this handoff's Result. No code. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/gemini/uzbek-pass`, stop and say so. Work only in the worktree `.worktrees/gemini-uzbek-pass`. Never commit to `main`, never push.

Read `client/src/shared/i18n/GLOSSARY.md` first and use its words. Uzbek in Latin script, the short plain wording a shop cashier uses, the same word for the same thing everywhere (look at how the neighbouring keys in the same file say it).

1. List what is still English:
   ```
   cd client/src/shared/i18n && node ../../../scripts/i18n-untranslated.mjs
   ```
   Then print the keys themselves (change the script's last lines to print them if you need to, but do not commit that change) and translate every one in its `uz/*.json` file.
   - Never change a key name, never change the `en` text, never remove a key.
   - Keep every placeholder exactly as it is: `{count}`, `{points}`, `{name}` and so on.
   - A text that is right to leave as it is (a unit such as `58 mm`, a brand, `IMEI`) stays; list each one in the Result with the reason. Nothing else may stay the same as English.
   - Bonus points: one point is one unit of money, but points are not money. Pick one Uzbek word for "points" and use it in every file; write it into `GLOSSARY.md`.

2. Add six missing keys, to both `en` and `uz`, in the file named by the part before the dot: `common.loadMore` ("Load more"), `common.clear` ("Clear"), `common.offline` ("Offline"), `inventory.selectDevice` ("Select a device"), `shipments.selectShipment` ("Select a shipment"), `qc.dateRange` ("Date range"). English as given, Uzbek by you.

3. Read every `uz` text in `backups.json`, and every `uz` text about the danger zone (erasing data) and about the setup wizard (`setup.json`). Fix what a native speaker would not say, what is unclear, and what is too soft for a warning: the erase warnings must be impossible to misread. List each text you changed, old and new, in the Result.

4. New words you chose go into `GLOSSARY.md`.

Checks, real output pasted:
```
cd client/src/shared/i18n && node ../../../scripts/i18n-untranslated.mjs
cd client && pnpm lint && pnpm build
```
The script's total must equal the number of texts you listed as rightly unchanged.

Commit on this branch, adding files by path (never `git add -A`). Your editor adds blank lines to files it opens: run `git status` before you finish and discard that noise. Do not edit anything outside `client/src/shared/i18n/**` and this handoff.

Fill the Result section of `docs/handoffs/gemini/031-uzbek-pass.md` in THIS worktree, set Status to done, and commit that too.
=== END ===

## Result (Gemini fills)
- Commits:
  - `671fafe6`: i18n: complete Uzbek translations and refine backup and setup copy
  - `15ededad`: docs(handoff): record results for 031 Uzbek pass
- Script output before and after:
  Before:
  ```
  backups.json: 1
  customers.json: 23
  inventory.json: 8
  orders.json: 1
  pos.json: 18
  purchases.json: 3
  repairs.json: 28
  reports.json: 3
  sales.json: 4
  settings.json: 10
  setup.json: 7
  shifts.json: 1
  storefront.json: 1
  sync.json: 2
  total 110
  ```
  After:
  ```
  inventory.json: 1
  pos.json: 1
  repairs.json: 1
  setup.json: 1
  shifts.json: 1
  storefront.json: 1
  sync.json: 1
  total 7
  ```
- Texts left the same as English, each with the reason:
  1. `inventory.json` -> `imei2`: `"IMEI 2"` — International telecommunications standard acronym (International Mobile Equipment Identity) indicating the secondary SIM / eSIM slot.
  2. `pos.json` -> `modeNasiya`: `"Nasiya"` — Authentic Uzbek term for consignment sale, used as-is in English mode as well.
  3. `repairs.json` -> `imei`: `"IMEI"` — International telecommunications standard acronym.
  4. `setup.json` -> `stepTelegram`: `"Telegram"` — Proprietary brand and application name of the messaging service.
  5. `shifts.json` -> `count`: `"{count}"` — Raw placeholder interpolation variable required to be preserved exactly as-is.
  6. `storefront.json` -> `contactTelegram`: `"Telegram"` — Proprietary brand and application name of the messaging service.
  7. `sync.json` -> `colImei`: `"IMEI"` — International telecommunications standard acronym.
- The word chosen for "points":
  `ball` (plural: `ballar`). Added to `GLOSSARY.md` as:
  `| Point / Bonus Point | Ball / Bonus ball | Sodiqlik dasturida xarid uchun beriladigan va to'lovda ishlatiladigan shartli birlik (1 ball = 1 valyuta birligi, lekin naqd pul emas) |`
- Item 3: texts changed, old → new:
  - `backups.json`:
    - `passphraseDesc_missing`:
      - old: `"Parol hali yo'q. Parol o'rnatilmaguncha zaxiralash o'chiq turadi."`
      - new: `"Parol hali o'rnatilmagan. Shifrlash paroli kiritilmaguncha zaxiralash ishlamaydi."`
    - `scheduleTimeLabel`:
      - old: `"Kun vaqti"`
      - new: `"Zaxiralash vaqti"`
    - `keepLastLabel`:
      - old: `"Nechta saqlanadi"`
      - new: `"Saqlanadigan nusxalar soni"`
    - `runPartlyFailed`:
      - old: `"Zaxira nusxa olindi, lekin bir joy muvaffaqiyatsiz. Ro'yxatga qarang."`
      - new: `"Zaxira nusxa olindi, ammo ayrim saqlash joylarida xatolik yuz berdi. Ro'yxatga qarang."`
    - `placeStatusOk`:
      - old: `"Joyida"`
      - new: `"Ishlayapti"`
    - `clientIdLabel`:
      - old: `"Client ID"`
      - new: `"Mijoz IDsi (Client ID)"`
    - `colTrigger`:
      - old: `"Kim"`
      - new: `"Turi"`
    - `triggerSchedule`:
      - old: `"Jadval"`
      - new: `"Jadval bo'yicha"`
    - `restoreWarning`:
      - old: `"Bu butun ma'lumotlar bazasini va barcha rasmlarni almashtiradi. Shu zaxiradan keyingi hamma narsa yo'qoladi va hamma tizimdan chiqariladi."`
      - new: `"DIQQAT! Ushbu amal butun ma'lumotlar bazasi va barcha rasmlarni zaxira nusxadagi holatga qaytaradi. Shu zaxiradan keyin kiritilgan BARCHA ma'lumotlar butunlay yo'qoladi va barcha foydalanuvchilar tizimdan chiqariladi."`
    - `overlayRestoringTitle`:
      - old: `"Tiklanmoqda, kuting"`
      - new: `"Tiklanmoqda, iltimos kuting"`
    - `overlayRestoringBody`:
      - old: `"Tizim zaxira nusxadan tiklanmoqda. Bu oynani yopmang. U o'zi qaytadi."`
      - new: `"Tizim zaxira nusxadan tiklanmoqda. Ushbu oynani yopmang. Jarayon tugagach sahifa avtomatik yangilanadi."`
    - `overlayManualTitle`:
      - old: `"Qo'lda tiklash kerak"`
      - new: `"Qo'lda tiklash talab etiladi"`
    - `overlayManualBody`:
      - old: `"Tiklash yakunlanmadi va orqaga qaytarib bo'lmadi. Boshqa amal qilishdan oldin tizimni o'rnatgan odamga murojaat qiling."`
      - new: `"Tiklash jarayoni yakunlanmadi va avvalgi holatga qaytarib bo'lmadi. Hech qanday amal bajarmasdan, zudlik bilan tizim administratoriga murojaat qiling."`
    - `overlayWipingTitle`:
      - old: `"O'chirilmoqda, kuting"`
      - new: `"Tozalanmoqda, iltimos kuting"`
    - `overlayWipingBody`:
      - old: `"Tizim do'kon ma'lumotlarini o'chirmoqda. Bu oynani yopmang. U o'zi qaytadi."`
      - new: `"Tizim do'kon ma'lumotlarini tozalamoqda. Ushbu oynani yopmang. Jarayon tugagach sahifa avtomatik yangilanadi."`
    - `overlayWipeDoneTitle`:
      - old: `"Ma'lumotlar o'chirildi"`
      - new: `"Ma'lumotlar tozalandi"`
    - `overlayWipeDoneBody`:
      - old: `"Do'kon ma'lumotlari o'chirildi va barcha sessiyalar yopildi. Avval xavfsizlik zaxirasi olingan. Iltimos, qaytadan tizimga kiring."`
      - new: `"Do'kon ma'lumotlari tozalandi va barcha sessiyalar yakunlandi. Oldin xavfsizlik zaxirasi olingan. Iltimos, qaytadan tizimga kiring."`
    - `dangerZoneDesc`:
      - old: `"Toza boshlash uchun do'kon ma'lumotlarini o'chirish. Avval xavfsizlik zaxirasi olinadi."`
      - new: `"Do'konni noldan boshlash uchun barcha ma'lumotlarni tozalash. Oldin avtomatik xavfsizlik zaxira nusxasi olinadi."`
    - `dangerZoneButton`:
      - old: `"Do'kon ma'lumotlarini o'chirish"`
      - new: `"Do'kon ma'lumotlarini tozalash"`
    - `wipeTitle`:
      - old: `"Do'kon ma'lumotlarini o'chirish"`
      - new: `"Do'kon ma'lumotlarini tozalash"`
    - `wipeWarning`:
      - old: `"Bu barcha savdolar, ombor, pul va boshqa yozuvlarni o'chiradi. Buni bu yerdan qaytarib bo'lmaydi — faqat avval olingan xavfsizlik zaxirasini tiklash orqali."`
      - new: `"OGOHLANTIRISH: Bu amal barcha savdolar, ombor qoldiqlari, kassa, to'lovlar va boshqa amaliyot yozuvlarini butunlay o'chirib tashlaydi! Buni bu yerdan qaytarib bo'lmaydi — faqat avval olingan xavfsizlik zaxirasini tiklash orqaligina ma'lumotlarni qaytarish mumkin."`
    - `wipeWillErase`:
      - old: `"Quyidagilar o'chiriladi:"`
      - new: `"Quyidagilar butunlay o'chiriladi:"`
    - `wipeAlways`:
      - old: `"Barcha savdolar, ombor, pul, ta'mirlar va tekshiruvlar"`
      - new: `"Barcha savdolar, ombor qoldiqlari, kassa amallari, ta'mirlar va sifat tekshiruvlari"`
    - `wipeContactsLabel`:
      - old: `"Mijozlar, hamkorlar va yetkazib beruvchilarni ham o'chirish"`
      - new: `"Mijozlar, hamkorlar va yetkazib beruvchilarni ham tozalash"`
    - `wipeCatalogLabel`:
      - old: `"Mahsulotlar katalogini ham o'chirish (tovarlar, narxlar, rasmlar)"`
      - new: `"Mahsulotlar katalogini ham tozalash (tovarlar, narxlar, rasmlar)"`
    - `wipeTotalLabel`:
      - old: `"Jami o'chiriladi"`
      - new: `"Jami o'chiriladigan yozuvlar"`
    - `wipeKeptTitle`:
      - old: `"Nima saqlanadi"`
      - new: `"Nimalar saqlanib qoladi"`
    - `wipeKept`:
      - old: `"Foydalanuvchi hisoblari, filiallar, barcha sozlamalar, zaxira nusxalar hamda tizim ma'lumotnomalari va telefon ro'yxatlari."`
      - new: `"Foydalanuvchi hisoblari, filiallar, tizim sozlamalari, zaxira nusxalar hamda ma'lumotnomalar va telefon modellari ro'yxati."`
    - `wipeSafetyNote`:
      - old: `"Avval xavfsizlik zaxirasi olinadi. O'chirishni qaytarish uchun yuqoridagi ro'yxatdan o'sha zaxirani tiklang."`
      - new: `"O'chirishdan oldin avtomatik xavfsizlik zaxira nusxasi olinadi. O'chirishni bekor qilish uchun yuqoridagi ro'yxatdan ushbu zaxirani tiklang."`
    - `wipeUnderstandLabel`:
      - old: `"Buni bu yerdan qaytarib bo'lmasligini tushunaman"`
      - new: `"Barcha ma'lumotlar o'chirilishini va bu amalni to'g'ridan-to'g'ri qaytarib bo'lmasligini to'liq tushunaman"`
    - `wipeConfirm`:
      - old: `"Hozir o'chirish"`
      - new: `"Ma'lumotlarni butunlay o'chirish"`
    - `wipeStarting`:
      - old: `"Boshlanmoqda..."`
      - new: `"Tozalash boshlanmoqda..."`
    - `wipeRecordTitle`:
      - old: `"O'tgan o'chirishlar"`
      - new: `"Tozalashlar tarixi"`
    - `wipeColWhat`:
      - old: `"O'chirilgan"`
      - new: `"O'chirilgan ma'lumotlar"`
    - `wipeColRows`:
      - old: `"Yozuvlar"`
      - new: `"Qatorlar soni"`
    - `wipeWhatBase`:
      - old: `"Do'kon ma'lumotlari"`
      - new: `"Asosiy do'kon ma'lumotlari"`
    - `wipeWhatContacts`:
      - old: `"kontaktlar"`
      - new: `"Mijozlar va hamkorlar"`
    - `wipeWhatCatalog`:
      - old: `"katalog"`
      - new: `"Tovarlar katalogi"`
    - `wipeErrRunning`:
      - old: `"Zaxiralash, tiklash yoki o'chirish allaqachon bajarilmoqda. Tugagach qayta urinib ko'ring."`
      - new: `"Ayni paytda zaxiralash, tiklash yoki tozalash jarayoni ketmoqda. Jarayon tugagach qayta urinib ko'ring."`
    - `wipeErrNoPassphrase`:
      - old: `"Avval zaxiralash parolini o'rnating (yuqoridagi 'Shifrlash paroli' bo'limiga qarang), shunda xavfsizlik zaxirasi olinishi mumkin."`
      - new: `"Avval zaxira shifrlash parolini o'rnating (yuqoridagi 'Shifrlash paroli' bo'limi), aks holda xavfsizlik zaxirasini yaratib bo'lmaydi."`
    - `wipeErrSafetyBackup`:
      - old: `"Xavfsizlik zaxirasini olib yoki ochib bo'lmadi, shuning uchun hech narsa o'chirilmadi. Yuqoridagi zaxira nusxalarni tekshirib, qayta urinib ko'ring."`
      - new: `"Xavfsizlik zaxira nusxasini yaratib yoki tekshirib bo'lmadi, shu sababli hech qanday ma'lumot o'chirilmadi. Yuqoridagi zaxira sozlamalarini tekshirib, qayta urinib ko'ring."`
    - `errProviderNotConfigured`:
      - old: `"Avval bu joyni sozlang."`
      - new: `"Avval ushbu saqlash joyini sozlang."`
    - `errLocalLocked`:
      - old: `"Server diskini o'chirib bo'lmaydi."`
      - new: `"Serverning asosiy diskini o'chirib qo'yish mumkin emas."`
    - `errProviderNotConnected`:
      - old: `"Avval bu joyni ulang."`
      - new: `"Avval ushbu saqlash joyini ulang."`
    - `errChatIsStaffChat`:
      - old: `"Bu chat xodimlar ogohlantirishlari uchun ishlatiladi. Zaxiralar uchun alohida chatdan foydalaning."`
      - new: `"Bu chat xodimlar xabarnomalari uchun ishlatiladi. Zaxiralar uchun boshqa alohida chatdan foydalaning."`
    - `errOauthNotSupported`:
      - old: `"Bu joy Ulanishdan foydalanmaydi."`
      - new: `"Ushbu saqlash joyi ulanish (OAuth) orqali ishlashni qo'llab-quvvatlamaydi."`
    - `errOauthReturnUrl`:
      - old: `"Qaytish manziliga ruxsat yo'q."`
      - new: `"Qaytish (redirect) manziliga ruxsat berilmagan."`
    - `errTooManyTries`:
      - old: `"Juda ko'p urinish. Bir daqiqa kutib, qayta urinib ko'ring."`
      - new: `"Urinishlar soni juda ko'p. Bir daqiqa kutib, qayta urinib ko'ring."`
  - `setup.json`:
    - `stepOwner`:
      - old: `"Egasi hisobi"`
      - new: `"Do'kon egasi"`
    - `stepTheme`:
      - old: `"Mavzu"`
      - new: `"Ko'rinish mavzusi"`
    - `chatId`:
      - old: `"Telegram chat ID"`
      - new: `"Telegram chat IDsi"`
    - `themePreviewText`:
      - old: `"Text preview"`
      - new: `"Matn ko'rinishi"`
    - `themePreviewAction`:
      - old: `"Action"`
      - new: `"Tugma"`
    - `themeCalderaName`:
      - old: `"Caldera Light"`
      - new: `"Caldera (yorug')"`
    - `themeCalderaDesc`:
      - old: `"Default warm light retail theme"`
      - new: `"Standart iliq yorug' savdo mavzusi"`
    - `themeSandName`:
      - old: `"Warm Sand"`
      - new: `"Warm Sand (iliq qum)"`
    - `themeSandDesc`:
      - old: `"Subtle desert ochre palette"`
      - new: `"Sahro oxrasi rangidagi mayin palitra"`
    - `summaryOwner`:
      - old: `"Egasi hisobi"`
      - new: `"Do'kon egasi hisobi"`
- Lint and build output (last lines):
  - Lint:
    ```
    Found 148 warnings and 0 errors.
    Finished in 85ms on 904 files with 119 rules using 16 threads.
    ```
  - Build:
    ```
    ✓ built in 6.91s
    PWA v2.0.0
    mode      generateSW
    precache  148 entries (3429.04 KiB)
    files generated
      dist/sw.js
      dist/workbox-9c191d2f.js
    ```
- Not done / skipped:
  None.

## Check by Claude
- 2026-11-06: checked and merged. Run by Claude: the untranslated script (110 before, 7 after,
  each of the 7 rightly unchanged: IMEI, IMEI 2, Telegram twice, Nasiya, a bare `{count}`); every
  key is in both languages; every placeholder is the same in `en` and `uz`; the only English
  changes are the six added keys; website lint and build pass on `main`.
- Not checked: whether the Uzbek reads well. Claude cannot judge that; a native read is the user's.

