const TERMINAL_ID_KEY = "mobile-erp-terminal-id"

function makeId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `t_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/** A stable id for this browser, generated once and kept across reloads. */
export function getTerminalId(): string {
  try {
    const existing = localStorage.getItem(TERMINAL_ID_KEY)
    if (existing) return existing
    const id = makeId()
    localStorage.setItem(TERMINAL_ID_KEY, id)
    return id
  } catch {
    // Private mode: a per-session id is still better than none.
    return makeId()
  }
}
