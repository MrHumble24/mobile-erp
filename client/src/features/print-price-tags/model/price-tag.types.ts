/** One shelf label. Pages map their own rows into these; the feature knows no entity. */
export interface PriceTagItem {
  id: string
  title: string
  subtitle: string | null
  price: number | string | null
  code: string | null
  /** Whether the row is ticked when the dialog opens. */
  preselected: boolean
}
