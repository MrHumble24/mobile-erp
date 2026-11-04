# Theme — Warm Card tokens

Source of truth: repo-root [`DESIGN.md`](../../../../DESIGN.md) (ADR 0022). The
same values drive `Tokens.kt` on Android. Change a value here, nowhere else.

- **Tokens.swift** — palette, `Space`, `Radius`, status→hue/tint helpers.
- **Typography.swift** — the type ramp: `Font.ui(...)`, `Font.data(...)`,
  `Font.mono(...)`, each `UIFontMetrics`-scaled (Dynamic Type).
- **VariableFont.swift** — the one place the `wght` variation axis is set on a
  bundled variable TTF (iOS 17 does not interpolate it via `.weight()`).
- **AppAppearance.swift** — themes the UIKit tab/navigation bars at launch.

## DESIGN.md → token mapping
Warm names are what new code uses: `ground`, `card`, `surface2`, `border`,
`text`, `muted`, `action`/`actionPressed`/`onAction`, `success`/`successBg`,
`danger`/`dangerBg`, `warning`/`warningBg`, `info`/`infoBg`, `sold`/`soldBg`.
Radii: `cards 16`, `controls 12`, `buttons 14`, `pill`. Spacing:
`xs/sm/md/lg/gutter = 4/8/12/16/20`, `cardPad 20`, `controlH 52`, `rowH 48`,
`minTouch 44`.

### Status pills (text on tint, verified ≥ 4.5:1)
Light hues are the deep ramp step; both modes from the corrected DESIGN.md.

| status  | light text / tint   | ratio | dark text / tint    | ratio |
|---------|---------------------|-------|---------------------|-------|
| success | `#12603A` / `#E3F5EA`| 6.71  | `#3DB876` / `#0B3F24`| 4.75  |
| danger  | `#AB1E30` / `#FBE3E6`| 5.82  | `#F28F9B` / `#7E1626`| 4.52  |
| warning | `#7A4D00` / `#FCEFD6`| 6.39  | `#F0A633` / `#4D3100`| 5.82  |
| info    | `#2455AD` / `#E4ECFB`| 5.94  | `#5C8FE5` / `#10264F`| 4.61  |
| sold    | `#5E5E5E` / `#EFEAE2`| 5.42  | `#A89C8E` / `#352C24`| 5.08  |

## Legacy aliases
Old Ink names remain as aliases so unmigrated call sites compile:
`bg→ground`, `surface→card`, `mist→surface2`, `hairline→border`, `ink→text`
(the app tint is now `action`, not `ink`), `onInk→onAction`, `slate→muted`,
`ash→sold`, `signalBlue→info`, `ring→text` (field focus ring, never orange),
`okBg/warnBg/badBg→the new tints`,
`Radius.inputs→controls`, `Radius.large→cards`. **New code must use the warm
names**, never the aliases; the aliases go away when the remaining screens
adopt the kit.
