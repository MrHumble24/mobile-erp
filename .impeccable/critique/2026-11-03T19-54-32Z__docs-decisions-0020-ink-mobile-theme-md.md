---
target: Ink mobile design system (Android + iOS)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/abdulboriymalikov/projects/mobile-erp/docs/decisions/0020-ink-mobile-theme.md"
target_fingerprint: "sha256:0098eec253308a61f15ee1a18f3d23ea919c79245f355d31af59dfa8e1b17fd7"
target_path: /Users/abdulboriymalikov/projects/mobile-erp/docs/decisions/0020-ink-mobile-theme.md
timestamp: 2026-11-03T19-54-32Z
slug: docs-decisions-0020-ink-mobile-theme-md
---
Method: design review only (detector not applicable, native platform)
Target: Ink mobile design system (Android ui/theme + shared/ui, iOS Theme/Tokens.swift + Shared/), evidence from emulator/simulator captures and two source inventories.

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Strong status colour; stock spinners, no motion on Android |
| 2 | Match System / Real World | 3 | iOS dashboard ships English copy |
| 3 | User Control and Freedom | 3 | Platform defaults only |
| 4 | Consistency and Standards | 1 | Platforms disagree on font, buttons, segments, tiles, spacing tokens; 3 pill encodings; 9 vs 10 dp |
| 5 | Error Prevention | 3 | Field error states exist |
| 6 | Recognition Rather Than Recall | 3 | Labels above fields |
| 7 | Flexibility and Efficiency | 3 | Scanner field everywhere; haptics iOS-only, ad hoc |
| 8 | Aesthetic and Minimalist Design | 2 | Palette not a voice; Material/stock-iOS parts show |
| 9 | Error Recovery | 3 | Retry views both platforms |
| 10 | Help and Documentation | 2 | No DESIGN.md; README/ADR contradictions |
| Total | | 26/40 | Functional, undistinguished |

## Design Specificity Verdict
Category-interchangeable: Ink is a palette, three radii and a font choice, not a system. Android wraps Material without replacing behaviour; iOS owns fewer primitives than Android. Deterministic scan: not applicable (native).

## Priority Issues
- [P0] No system of record: ADR/README/token files contradict (iOS font, spacing source, Android fonts). No component anatomy, states, motion, haptics spec. Fix: author the system spec and build both kits from it. /impeccable shape
- [P1] Android ships Material behaviour under an Ink skin: default ripple everywhere, stock M3 date pickers (28dp dialog), stock drag handle/scrim, stock dropdown menus, stock TopAppBar, NavigationRail pill, button elevation, raw SnackbarHost (ExpensesScreen), 56dp outlined fields. Fix: own each in shared/ui. /impeccable extract then polish
- [P1] iOS has half a kit: no button style, segmented, field, sheet, filter sheet, spacing tokens; 44 stock buttons, 29 stock pickers, 37 stock Forms, .secondary x223, Tokens.ring unused. Fix: port Android primitives under same names. /impeccable extract
- [P1] Typography is two systems: Android Plex Sans ramp; iOS system font, no ramp, 27 hand-picked sizes, fixed-size mono ignoring Dynamic Type. Fix: one decision, shared ramp. /impeccable typeset
- [P2] Rhythm/shape unsystematised: Android 617 raw dp vs 78 token uses, 9dp inputs vs 10dp shape, 3 pill encodings; iOS 274 raw spacing, no Space tokens. /impeccable layout
- [P2] No motion/feedback vocabulary: Android zero animations, default nav fade; iOS minimal, no reduce-motion, 59 ad hoc haptic calls. /impeccable animate

## Persona Red Flags
- QC specialist: Android scan has no capture feedback; iOS buzzes. Two feelings, one product.
- Sam: iOS mono ignores Dynamic Type; no reduce-motion on either platform.
- Alex: full Material calendar for "today/this week" fields.

## Minor Observations
English copy on iOS dashboard; screen title differs (Boshqaruv paneli vs Bosh sahifa); 2 Filled MoreVert; purple QC icon on iOS; Android theme parent Theme.Material.Light, no navigationBarColor, no splash; signal-blue focus ring undocumented; Settings nests fields in cards in sections.

## Questions to Consider
- What does this system look like that a generic admin template could not?
- Should a cashier tell the Android and iPhone apps apart at arm's length?
- Is monochrome the identity, or just the absence of one?
