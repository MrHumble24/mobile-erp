import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useDeviceModels, type DeviceModelView } from "@/entities/device-model"
import { useAddShipmentDevices, type RegisterDeviceItem } from "@/entities/shipment"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { toast } from "@/shared/ui/sonner"

function DeviceBatchTable({
  items,
  modelsMap,
  onRemove,
}: {
  items: RegisterDeviceItem[]
  modelsMap: Record<string, string>
  onRemove: (index: number) => void
}) {
  const { t } = useI18n()
  if (items.length === 0) return null
  return (
    <div className="border rounded-md max-h-48 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IMEI</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("inventory.storage")}</TableHead>
            <TableHead>{t("shipments.acquisitionCost")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it, idx) => (
            <TableRow key={it.imei}>
              <TableCell className="font-mono text-xs">{it.imei}</TableCell>
              <TableCell className="text-xs">{modelsMap[it.modelId] || it.modelId}</TableCell>
              <TableCell className="text-xs">{String(it.specs.storage || "-")}</TableCell>
              <TableCell className="text-xs font-semibold">${it.acquisitionCost}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onRemove(idx)} className="h-7 text-xs text-destructive">
                  {t("common.delete")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ModelStorageRow({
  modelId,
  onModelChange,
  models,
  storage,
  onStorageChange,
}: {
  modelId: string
  onModelChange: (val: string) => void
  models: DeviceModelView[]
  storage: string
  onStorageChange: (val: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>{t("inventory.model")}</Label>
        <Select value={modelId} onValueChange={(val) => onModelChange(val || "")}>
          <SelectTrigger className="h-10"><SelectValue placeholder={t("shipments.selectModel")} /></SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.brand} {m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t("inventory.storage")}</Label>
        <Input value={storage} onChange={(e) => onStorageChange(e.target.value)} placeholder="128GB" className="h-10" />
      </div>
    </div>
  )
}

function PricingRow({
  color,
  onColorChange,
  cost,
  onCostChange,
  targetPrice,
  onTargetPriceChange,
}: {
  color: string
  onColorChange: (val: string) => void
  cost: number
  onCostChange: (val: number) => void
  targetPrice: number
  onTargetPriceChange: (val: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label>{t("inventory.color")}</Label>
        <Input value={color} onChange={(e) => onColorChange(e.target.value)} placeholder="Rang" className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("shipments.acquisitionCost")}</Label>
        <Input type="number" min={0} value={cost} onChange={(e) => onCostChange(Number(e.target.value))} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("shipments.targetPrice")}</Label>
        <Input type="number" min={0} value={targetPrice} onChange={(e) => onTargetPriceChange(Number(e.target.value))} className="h-10" />
      </div>
    </div>
  )
}

function ScanInput({ imei, onChange, onScan }: { imei: string; onChange: (v: string) => void; onScan: () => void }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <Label>{t("shipments.scanImei")}</Label>
      <BarcodeInput value={imei} onChange={(e) => onChange(e.target.value)} onScan={onScan} placeholder="358249091234567" className="h-10" />
    </div>
  )
}

function BatchSubmitButton({
  shipmentId,
  batch,
  onFinish,
  setErrorMsg,
}: {
  shipmentId: string
  batch: RegisterDeviceItem[]
  onFinish: () => void
  setErrorMsg: (msg: string) => void
}) {
  const { t } = useI18n()
  const addDevicesMutation = useAddShipmentDevices()

  const handleSave = () => {
    if (batch.length === 0) return
    addDevicesMutation.mutate(
      { id: shipmentId, dto: { devices: batch } },
      {
        onSuccess: () => { toast.success(t("common.success")); onFinish() },
        onError: (err: any) => { setErrorMsg(err?.message || t("common.error")) },
      }
    )
  }

  return (
    <Button className="w-full" onClick={handleSave} disabled={batch.length === 0 || addDevicesMutation.isPending}>
      {addDevicesMutation.isPending ? t("common.loading") : `${t("shipments.submitBatch")} (${batch.length})`}
    </Button>
  )
}

export function DeviceIntakeLoop({
  shipmentId,
  onFinish,
}: {
  shipmentId: string
  onFinish: () => void
}) {
  const { t } = useI18n()
  const { data: modelsData } = useDeviceModels()
  const [batch, setBatch] = React.useState<RegisterDeviceItem[]>([])
  const [imei, setImei] = React.useState("")
  const [modelId, setModelId] = React.useState("")
  const [storage, setStorage] = React.useState("128GB")
  const [color, setColor] = React.useState("Black")
  const [cost, setCost] = React.useState(500)
  const [targetPrice, setTargetPrice] = React.useState(600)
  const [errorMsg, setErrorMsg] = React.useState("")

  const modelsMap = React.useMemo(() => {
    return (modelsData || []).reduce<Record<string, string>>((acc, m) => {
      acc[m.id] = `${m.brand} ${m.name}`
      return acc
    }, {})
  }, [modelsData])

  const handleAdd = () => {
    const trimmed = imei.trim()
    if (!/^\d{15}$/.test(trimmed)) return setErrorMsg("IMEI aniq 15 ta raqam bo'lishi shart")
    if (batch.some((b) => b.imei === trimmed)) return setErrorMsg(t("shipments.duplicateImei"))
    if (!modelId) return setErrorMsg("Modelni tanlang")
    setErrorMsg("")
    setBatch((p) => [...p, { imei: trimmed, modelId, specs: { storage, color }, acquisitionCost: cost, targetPrice }])
    setImei("")
  }

  return (
    <div className="space-y-4">
      {errorMsg && <div className="p-3 text-sm rounded bg-destructive/15 text-destructive font-medium">{errorMsg}</div>}
      <ScanInput imei={imei} onChange={(v) => { setImei(v); setErrorMsg("") }} onScan={handleAdd} />
      <ModelStorageRow modelId={modelId} onModelChange={setModelId} models={modelsData || []} storage={storage} onStorageChange={setStorage} />
      <PricingRow color={color} onColorChange={setColor} cost={cost} onCostChange={setCost} targetPrice={targetPrice} onTargetPriceChange={setTargetPrice} />
      <Button type="button" variant="outline" className="w-full" onClick={handleAdd}>+ {t("shipments.addDevice")}</Button>
      <div className="space-y-2 pt-2 border-t">
        <span className="text-sm font-semibold">{t("shipments.deviceList")} ({batch.length})</span>
        <DeviceBatchTable items={batch} modelsMap={modelsMap} onRemove={(idx) => setBatch((p) => p.filter((_, i) => i !== idx))} />
      </div>
      <BatchSubmitButton shipmentId={shipmentId} batch={batch} onFinish={onFinish} setErrorMsg={setErrorMsg} />
    </div>
  )
}
