/** Fixed storage sizes offered as filter/edit options; server has no distinct-values endpoint. */
export const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"] as const

export type StorageOption = (typeof STORAGE_OPTIONS)[number]
