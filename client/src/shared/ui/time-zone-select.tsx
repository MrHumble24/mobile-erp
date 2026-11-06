import * as React from "react"
import { Combobox, type ComboboxOption } from "@/shared/ui/combobox"

function getSupportedTimeZones(): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone")
    } catch {
      // Fallback below
    }
  }
  return [
    "Africa/Cairo",
    "America/Chicago",
    "America/Los_Angeles",
    "America/New_York",
    "America/Sao_Paulo",
    "Asia/Dubai",
    "Asia/Hong_Kong",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Tashkent",
    "Asia/Tokyo",
    "Europe/Berlin",
    "Europe/London",
    "Europe/Moscow",
    "Europe/Paris",
    "UTC",
  ]
}

const TIME_ZONE_OPTIONS: ComboboxOption[] = getSupportedTimeZones().map((tz) => ({
  value: tz,
  label: tz,
}))

export interface TimeZoneSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function TimeZoneSelect({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Select time zone...",
}: TimeZoneSelectProps) {
  const options = React.useMemo(() => {
    if (value && !TIME_ZONE_OPTIONS.some((o) => o.value === value)) {
      return [{ value, label: value }, ...TIME_ZONE_OPTIONS]
    }
    return TIME_ZONE_OPTIONS
  }, [value])

  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Search time zone..."
      emptyText="No time zone found."
      disabled={disabled}
      className={className}
    />
  )
}
