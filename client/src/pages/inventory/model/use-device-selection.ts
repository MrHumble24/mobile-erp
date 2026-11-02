import * as React from "react"
import type { DeviceView } from "@/entities/device"

export interface DeviceTarget {
  imei: string
  id?: string
}

/** UI state for the detail drawer and the edit dialog on the devices tab. */
export function useDeviceSelection() {
  const [target, setTarget] = React.useState<DeviceTarget | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [editDevice, setEditDevice] = React.useState<DeviceView | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)

  const openDrawer = (next: DeviceTarget) => {
    setTarget(next)
    setDrawerOpen(true)
  }

  const openEdit = (device: DeviceView) => {
    setEditDevice(device)
    setEditOpen(true)
  }

  return {
    target,
    drawerOpen,
    setDrawerOpen,
    openDrawer,
    editDevice,
    editOpen,
    setEditOpen,
    openEdit,
  }
}
