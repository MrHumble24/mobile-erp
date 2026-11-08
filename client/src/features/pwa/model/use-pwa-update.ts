import * as React from "react"
import { registerSW } from "virtual:pwa-register"

export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = React.useState(false)
  const [offlineReady, setOfflineReady] = React.useState(false)
  const updateSWRef = React.useRef<((reloadPage?: boolean) => Promise<void>) | null>(null)

  React.useEffect(() => {
    try {
      updateSWRef.current = registerSW({
        immediate: true,
        onNeedRefresh() {
          setNeedRefresh(true)
        },
        onOfflineReady() {
          setOfflineReady(true)
        },
        onRegisteredSW(_swUrl, r) {
          if (r) {
            // Periodic update check every 60 minutes
            setInterval(() => {
              r.update().catch(() => {})
            }, 60 * 60 * 1000)
          }
        },
        onRegisterError(error) {
          console.warn("PWA service worker registration error:", error)
        },
      })
    } catch (err) {
      console.warn("Unable to register service worker:", err)
    }
  }, [])

  const updateApp = React.useCallback(async () => {
    if (updateSWRef.current) {
      await updateSWRef.current(true)
    } else {
      window.location.reload()
    }
  }, [])

  return {
    needRefresh,
    offlineReady,
    setOfflineReady,
    updateApp,
  }
}

