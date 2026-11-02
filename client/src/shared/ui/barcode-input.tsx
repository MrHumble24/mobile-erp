import * as React from "react"
import { ScanBarcode, X } from "lucide-react"
import { Input, type InputProps } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

export interface BarcodeInputProps extends Omit<InputProps, "onSubmit"> {
  onScan?: (code: string) => void
  onClear?: () => void
}

function BarcodeInput({
  className,
  onScan,
  onClear,
  value,
  onChange,
  onKeyDown,
  placeholder = "Shtrix-kod yoki IMEI kiriting...",
  ...props
}: BarcodeInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && typeof value === "string" && value.trim()) {
      e.preventDefault()
      onScan?.(value.trim())
    }
    onKeyDown?.(e)
  }

  const hasValue = typeof value === "string" && value.length > 0

  return (
    <div className="relative flex items-center w-full">
      <ScanBarcode className="absolute left-3.5 size-4 stroke-[2] text-[#838383] pointer-events-none" />
      <Input
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("pl-10 pr-10 font-mono tracking-wide", className)}
        {...props}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 size-6 rounded-full bg-[#f8f9fa] hover:bg-[#eeeeee] text-[#646464] hover:text-[#202020] flex items-center justify-center transition-colors cursor-pointer outline-none"
        >
          <X className="size-3.5 stroke-[2]" />
          <span className="sr-only">Tozalash</span>
        </button>
      )}
    </div>
  )
}

export { BarcodeInput }
