import * as React from "react"

export interface FitText {
  containerRef: React.RefObject<HTMLSpanElement | null>
  textRef: React.RefObject<HTMLSpanElement | null>
  /** 1 when the text fits; shrinks toward `minScale` as it gets too wide. */
  scale: number
  /** True when even `minScale` is not enough — the caller should show a short form. */
  overflow: boolean
}

/**
 * Shrinks one line of text to fit its box via CSS transform (layout size is
 * unchanged, so the natural width stays measurable). Below `minScale` it stops
 * shrinking and reports `overflow`, letting the caller fall back to a short form.
 * Measures with the actual rendered content, so pass the value as `dep`.
 */
export function useFitText(dep: React.DependencyList[number], minScale = 0.5): FitText {
  const containerRef = React.useRef<HTMLSpanElement>(null)
  const textRef = React.useRef<HTMLSpanElement>(null)
  const [state, setState] = React.useState({ scale: 1, overflow: false })

  React.useLayoutEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const measure = () => {
      const available = container.clientWidth
      const natural = text.scrollWidth
      if (!available || !natural) return
      const raw = available / natural
      const scale = Math.min(1, Math.max(minScale, raw))
      const overflow = raw < minScale
      setState((prev) =>
        Math.abs(prev.scale - scale) < 0.005 && prev.overflow === overflow
          ? prev
          : { scale, overflow }
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [dep, minScale])

  return { containerRef, textRef, scale: state.scale, overflow: state.overflow }
}
