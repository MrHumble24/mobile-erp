import * as React from "react"

export interface FilePickerProps {
  accept?: string
  disabled?: boolean
  /** Called with the chosen file; the input is reset so the same file re-fires. */
  onPick: (file: File) => void
  /** A single trigger element (e.g. a Button); its click opens the picker. */
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
}

/**
 * The single wrapped file `<input>`: renders a hidden input and makes its
 * trigger child open the native picker. Keeps the forbidden native element in
 * one place (shared/ui).
 */
export function FilePicker({ accept, disabled, onPick, children }: FilePickerProps) {
  const ref = React.useRef<HTMLInputElement>(null)
  const trigger = React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e)
      if (!disabled) ref.current?.click()
    },
  })
  return (
    <>
      {trigger}
      <input
        ref={ref}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) onPick(file)
        }}
      />
    </>
  )
}
