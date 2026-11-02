import * as React from "react"

export interface PosShortcutHandlers {
  onFocusScanner: () => void
  onCheckout: () => void
  onClearScanner: () => void
  onRemoveLast: () => void
  onToggleCustomer: () => void
  onToggleMode: () => void
}

/**
 * Global POS keyboard shortcuts. Handlers are read through a ref so the window
 * listener is attached once, not re-subscribed on every render.
 */
export function usePosShortcuts(handlers: PosShortcutHandlers) {
  const ref = React.useRef(handlers)

  React.useEffect(() => {
    ref.current = handlers
  })

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = ref.current
      const meta = e.ctrlKey || e.metaKey
      if (meta && e.key === "Backspace") {
        e.preventDefault()
        h.onRemoveLast()
        return
      }
      switch (e.key) {
        case "F2":
          e.preventDefault()
          h.onFocusScanner()
          break
        case "F9":
          e.preventDefault()
          h.onCheckout()
          break
        case "F4":
          e.preventDefault()
          h.onToggleCustomer()
          break
        case "F8":
          e.preventDefault()
          h.onToggleMode()
          break
        case "Escape":
          h.onClearScanner()
          break
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
