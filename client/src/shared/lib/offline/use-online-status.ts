import * as React from "react"

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine
}

/** Re-renders on the browser's online/offline events. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = React.useState(isOnline)

  React.useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  return online
}
