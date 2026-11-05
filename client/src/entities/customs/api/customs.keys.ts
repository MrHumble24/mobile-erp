export const customsKeys = {
  all: ["customs"] as const,
  priceLists: () => [...customsKeys.all, "price-lists"] as const,
  current: () => [...customsKeys.all, "current"] as const,
  unmatched: () => [...customsKeys.all, "unmatched"] as const,
  feeHistory: (customsCode: string) =>
    [...customsKeys.all, "fee-history", customsCode] as const,
}
