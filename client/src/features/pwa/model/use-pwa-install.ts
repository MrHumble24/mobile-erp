import * as React from "react"

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false
  const isMatchMedia = window.matchMedia("(display-mode: standalone)").matches
  const isNavigator = (navigator as unknown as { standalone?: boolean }).standalone === true
  return isMatchMedia || isNavigator
}

function checkIsIosSafari(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  const isIos =
    /iPad|iPhone|iPod/.test(ua) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  const isSafari =
    /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

function useInstallListeners(
  setPrompt: (e: BeforeInstallPromptEvent | null) => void,
  setInstalled: (v: boolean) => void,
  setStandalone: (v: boolean) => void,
) {
  React.useEffect(() => {
    const handleBefore = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setPrompt(e)
    }
    const handleInstalled = () => {
      setPrompt(null)
      setInstalled(true)
      setStandalone(true)
    }
    const media = window.matchMedia("(display-mode: standalone)")
    const handleDisplay = () => setStandalone(checkIsStandalone())

    window.addEventListener("beforeinstallprompt", handleBefore)
    window.addEventListener("appinstalled", handleInstalled)
    media.addEventListener("change", handleDisplay)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBefore)
      window.removeEventListener("appinstalled", handleInstalled)
      media.removeEventListener("change", handleDisplay)
    }
  }, [setPrompt, setInstalled, setStandalone])
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = React.useState<boolean>(checkIsStandalone)
  const [isIosSafari] = React.useState<boolean>(checkIsIosSafari)
  const [isInstalled, setIsInstalled] = React.useState<boolean>(checkIsStandalone)
  const [showIosGuide, setShowIosGuide] = React.useState<boolean>(false)

  useInstallListeners(setDeferredPrompt, setIsInstalled, setIsStandalone)

  const install = React.useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null)
        setIsInstalled(true)
      }
      return choice.outcome
    }
    if (isIosSafari && !isStandalone) {
      setShowIosGuide(true)
      return "ios-guide"
    }
    return null
  }, [deferredPrompt, isIosSafari, isStandalone])

  return {
    isInstallable: !isStandalone && (Boolean(deferredPrompt) || isIosSafari),
    isStandalone,
    isIosSafari,
    isInstalled,
    showIosGuide,
    setShowIosGuide,
    install,
  }
}
