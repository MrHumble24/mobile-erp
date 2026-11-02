import tokensJson from "./tokens.json"

export const tokens = tokensJson

export const clickupColors = {
  signalWhite: "#ffffff",
  inkBlack: "#202020",
  onyx: "#090c1d",
  carbon: "#2a2a2a",
  slate: "#646464",
  ash: "#838383",
  fog: "#b3b3b3",
  cloud: "#d4d4d4",
  bone: "#e8e8e8",
  mist: "#f8f9fa",
  plaster: "#e9ebf0",
  mercury: "#eeeeee",
  brandViolet: "#6647f0",
  signalBlue: "#0091ff",
  mint: "#6ee7b7",
  emerald: "#00c07a",
  tealTag: "#16c0a4",
  rainbowConic: "#7d5be7",
  primaryGradient: "#40ddff",
  darkFade: "#111111",
} as const

export const clickupSurfaces = {
  canvas: clickupColors.signalWhite,
  card: clickupColors.mist,
  sectionBand: clickupColors.plaster,
  darkPanel: clickupColors.darkFade,
  inkSurface: "#000000",
} as const

export const clickupRadii = {
  tags: "100px",
  cards: "12px",
  badges: "9999px",
  images: "16px",
  inputs: "9px",
  buttons: "9999px",
  largecards: "20px",
} as const

export const clickupFonts = {
  display: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
  body: "'Inter', ui-sans-serif, system-ui, sans-serif",
  mono: "'Sometype Mono', ui-monospace, monospace",
} as const
