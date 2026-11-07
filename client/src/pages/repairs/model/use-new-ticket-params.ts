import { useSearchParams } from "react-router"

/** Deep link from a defective device drawer: `/repairs?new=1&imei=<code>`.
 *  Opening a ticket from there prefills the IMEI and clears the launch params
 *  on close, so a refresh does not reopen the dialog. */
export function useNewTicketParams() {
  const [params, setParams] = useSearchParams()
  const open = params.get("new") === "1"
  const imei = params.get("imei") ?? undefined

  const launch = () => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("new", "1")
      return next
    }, { replace: true })
  }
  const clear = () => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete("new")
      next.delete("imei")
      return next
    }, { replace: true })
  }
  return { open, imei, launch, clear }
}
