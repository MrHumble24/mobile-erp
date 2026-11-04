---
version: 1
slug: "mobile"
primary_target: "mobile"
related_targets: ["mobile/android/app/src/main/java/uz/malika/erp/shared/ui","mobile/ios/Mobile-erp/Mobile-erp/Shared"]
---

# Surface brief: mobile design system (Android + iOS)

Scope: the shared visual system of the two native apps, expressed first on the Kassa (POS) screen. Mode: Operate. Platform: adaptive (shared tokens, platform-specific anatomy).

Audience and job: cashier scanning IMEIs at a bazaar booth in daylight glare; QC specialist receiving batches; owner reading takings. Action: scan, confirm, pay. Proof: real units, real IMEIs, real amounts. Constraints: Uzbek copy from the shared i18n only; 48 dp / 44 pt targets; light and dark; 1.3x font scale; offline states visible.

Chosen direction: Warm Card, picked on the decision page from a "clean and premium" re-roll. Memorable moment: the capture spring.

## Direction contract

THESIS: One orange, always pressable. A warm tinted ground with white cards where colour has exactly one job; it refuses the category default of a grey monochrome screen with one decorative accent and Material or stock-iOS parts showing through.

OWN-WORLD: Ground #FBF6EE (dark #1C1713), white cards with no border or shadow, surface-2 #F4ECDF for secondary controls, text #2B2B2B, muted #8A8378, action orange #FF5A1F only on the primary action and the active tab, status hues in stock #1B9E5A / defective #D7263D / consigned #2F6FDB / sold #8A8378 on tinted pills. Onest for UI, Sometype Mono with tabular figures for IMEI, money, counts. Cards 16, controls 12, buttons 14, pills 999. Recognisable with all content removed: warm ground, white rounded blocks, one orange bar.

STORY: The cashier sees the scan field first, scans, watches the unit spring into the cart, reads the mono total, presses the one orange thing. Nothing on screen competes with that sequence.

FIRST VIEWPORT (Kassa, 390x844, matches .impeccable/mocks/decision/challenger-warm.html): native status bar; title "Kassa" 22/700 at the left gutter; a white 56 dp scan card with the real placeholder and camera glyph; a muted 13 caption heading; two white device cards (model 16/600, spec caption, mono IMEI; mono price and green status pill right); a white totals card with "Jami" and a 24 mono total; a muted customer line; the full-width orange pay button (52 dp, radius 14) as the only orange; the white bottom tab bar with the active tab in orange.

FORM: Warm consumer-app surface, dealt as a challenger in re-roll round 1 and chosen by the owner over the assigned Metro Marble and the pick Box Face; seed:9bf240e7a29f57ff.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions
- Dark-mode status values must be verified for AA on the dark card at implementation.
- Whether the web client adopts Warm Card is a separate decision.
- Tablet master-detail density is inherited from Android's current 720 dp split; confirm after the first screen is built.
