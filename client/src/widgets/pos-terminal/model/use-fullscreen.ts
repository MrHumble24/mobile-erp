import * as React from "react"

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void>
}

export interface FullscreenControls {
  isFullscreen: boolean
  supported: boolean
  toggle: () => void
  enter: () => void
  exit: () => void
}

/**
 * Browser fullscreen for the till. Browsers only grant fullscreen from a user
 * gesture, so this exposes an explicit toggle rather than requesting it on load.
 * State is read from the document (not local toggling) so F11 / Esc stay in sync.
 */
export function useFullscreen(): FullscreenControls {
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  React.useEffect(() => {
    const doc = document as FullscreenDocument
    const sync = () =>
      setIsFullscreen(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement))
    sync()
    document.addEventListener("fullscreenchange", sync)
    document.addEventListener("webkitfullscreenchange", sync)
    return () => {
      document.removeEventListener("fullscreenchange", sync)
      document.removeEventListener("webkitfullscreenchange", sync)
    }
  }, [])

  const supported =
    typeof document !== "undefined" &&
    Boolean(
      (document.documentElement as FullscreenElement).requestFullscreen ||
        (document.documentElement as FullscreenElement).webkitRequestFullscreen
    )

  const enter = React.useCallback(() => {
    const el = document.documentElement as FullscreenElement
    const request = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el)
    // A rejected promise just means the browser refused; keep the till usable.
    if (request) void request().catch(() => {})
  }, [])

  const exit = React.useCallback(() => {
    const doc = document as FullscreenDocument
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) return
    const leave = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc)
    if (leave) void leave().catch(() => {})
  }, [])

  const toggle = React.useCallback(() => {
    if (isFullscreen) exit()
    else enter()
  }, [isFullscreen, enter, exit])

  return { isFullscreen, supported, toggle, enter, exit }
}
