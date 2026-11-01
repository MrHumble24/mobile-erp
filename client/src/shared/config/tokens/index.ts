import tokensJson from './tokens.json'

export const tokens = tokensJson

export const calderaColors = {
  ember: '#fc5000',
  plasmaViolet: '#524ae9',
  sulfur: '#f5f28e',
  limestone: '#f7f6f2',
  pumice: '#e2e2df',
  obsidian: '#070607',
  chalk: '#ffffff',
} as const

export const calderaSurfaces = {
  canvas: calderaColors.pumice,
  surface: calderaColors.limestone,
  feature: calderaColors.ember,
  hero: calderaColors.plasmaViolet,
} as const

export const calderaRadii = {
  cards: '40px',
  pills: '800px',
  inputs: '100px',
  small: '16px',
  medium: '20px',
  buttons: '40px',
} as const

export const calderaFonts = {
  display: "'PP Neue Corp Compact', 'Bebas Neue', Anton, 'Druk Wide Bold', sans-serif",
  body: "'DM Sans', sans-serif",
  caption: "'System sans-serif', system-ui, sans-serif",
} as const

