import fs from 'node:fs'
let total = 0
for (const f of fs.readdirSync('en').filter(f => f.endsWith('.json'))) {
  const en = JSON.parse(fs.readFileSync(`en/${f}`)), uz = fs.existsSync(`uz/${f}`) ? JSON.parse(fs.readFileSync(`uz/${f}`)) : {}
  const walk = (a, b, p = '') => Object.entries(a).flatMap(([k, v]) => typeof v === 'object' ? walk(v, b?.[k] ?? {}, p + k + '.') : (b?.[k] === undefined ? [`${p}${k}  (MISSING in uz)`] : (b[k] === v && /[A-Za-z]{3}/.test(v) ? [`${p}${k}`] : [])))
  const same = walk(en, uz)
  total += same.length
  if (same.length) console.log(`${f}: ${same.length}`)
}
console.log('total', total)
