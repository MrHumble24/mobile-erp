import type { ReceiptView } from "../../model/sale.types"

export function ChequeHeader({ receipt }: { receipt: ReceiptView }) {
  const { store } = receipt
  return (
    <div className="text-center pb-2.5 border-b-2 border-dashed border-black/30 space-y-0.5">
      {store.name && <p className="font-black text-sm uppercase tracking-wider">{store.name}</p>}
      {store.address && <p className="text-[10px] text-foreground/75 font-medium">{store.address}</p>}
      {store.phone && <p className="text-[10px] text-foreground/75 font-medium">{store.phone}</p>}
      <p className="text-[10px] text-foreground/60">{new Date(receipt.soldAt).toLocaleString()}</p>
    </div>
  )
}
