---
target: Qurilmalarni qabul qilish sheet (Android intake)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/abdulboriymalikov/projects/mobile-erp/mobile/android/app/src/main/java/uz/malika/erp/features/procurement/ui/IntakeSheet.kt"
target_fingerprint: "sha256:35c633f0c851db20a7b857d5d7bd7288e52e82cfbed53d9875dc3692ab0735d5"
target_path: /Users/abdulboriymalikov/projects/mobile-erp/mobile/android/app/src/main/java/uz/malika/erp/features/procurement/ui/IntakeSheet.kt
timestamp: 2026-11-03T19-19-08Z
slug: rp-features-procurement-ui-intakesheet-kt-74892093
---
Method: design review only (detector not applicable, native platform)
Target: mobile/android IntakeSheet.kt + IntakeDeviceForm.kt ("Qurilmalarni qabul qilish"), reviewed in source and on the Pixel emulator with a simulated HID wedge scan.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Progress line says "0 ta kiritildi" on a batch with 4 registered units; scan feedback hidden below the keyboard |
| 2 | Match System / Real World | 3 | Spec labels "Storage"/"Color" arrive in English from the server |
| 3 | User Control and Freedom | 2 | Swipe-down discards staged units silently; keyboard cannot be dismissed (field re-grabs focus) |
| 4 | Consistency and Standards | 3 | Landed-cost box hand-built instead of AppCard |
| 5 | Error Prevention | 3 | Offline only discovered at submit |
| 6 | Recognition Rather Than Recall | 2 | Missing-model hint far from the select; staged rows omit model and cost |
| 7 | Flexibility and Efficiency | 3 | Confirm sheet per unit adds a tap per phone |
| 8 | Aesthetic and Minimalist Design | 2 | Six equal fields, scan last; nine decisions visible |
| 9 | Error Recovery | 2 | 409 on batch submit does not name the IMEI; error text off-screen |
| 10 | Help and Documentation | 2 | Only the scan placeholder guides; target price unexplained |
| Total | | 23/40 | Needs work |

## Design Specificity Verdict
Authored for this product (sticky defaults, next-slot fill, dual-SIM, misread confirm) but composed as a generic form: scanning is the sixth field and the soft keyboard is the first thing on screen. Deterministic scan: not applicable (native platform).

## Priority Issues
- [P0] Keyboard hides the scan target: autofocus summons the IME, scan field/feedback/staged list/submit are below the fold, sheet does not scroll under the IME, field re-requests focus after every submit. Fix: focus without IME (hide soft keyboard on autofocus, show only on tap), scan field first, scrollable body under IME. /impeccable harden
- [P1] Progress line counts only session drafts, ignoring shipment.deviceCount. Fix: registered + staged, staged count in the list heading. /impeccable clarify
- [P1] Staged drafts lost on dismiss with no prompt. Fix: hold drafts per shipment in the VM; confirm dismissal when drafts exist (needs a Gemini string). /impeccable harden
- [P1] Offline announced only at submit. Fix: offline state at top on open, submit disabled with reason. /impeccable harden
- [P2] Hierarchy is a form, not a scanning station; hint far from select; English attribute labels. Fix: scan + dual SIM first, batch defaults grouped and collapsible, staged list after; localized attribute labels need a backend contract. /impeccable layout

## Cognitive Load
5/8 checklist failures (single focus, chunking, grouping, hierarchy, minimal choices). High.

## Persona Red Flags
- QC specialist with Bluetooth scanner: scans, sees nothing change, scans again, hits the dedupe window.
- Alex: ten phones = ten confirm sheets; no way to skip confirm for HID scans.
- Casey: swipes sheet away mid-batch, loses all scans.

## Minor Observations
LandedResults not AppCard; staged rows lack model/cost; close icon and switch unlabeled for TalkBack; submit label wraps at 1.3x; raw 16/20 dp spacing.

## Questions to Consider
- Scanning station first, form second?
- Confirm only camera scans?
- Should intake queue offline like the other push handlers?
