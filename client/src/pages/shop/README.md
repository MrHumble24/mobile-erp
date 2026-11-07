# Shop Page

Public catalog grid showing products in stock across all active store branches.

## Features
- Accessible without authentication and outside AppShell.
- Displays friendly disabled message when storefront is toggled off.
- Real-time search and category filter chips.
- Product cards showing branch availability and pricing according to company policy.
- Responsive mobile-first layout down to 390px.

## Internal structure
- `ui/ShopPage.tsx` — orchestrates state, data hooks, and composes the sections.
- `ui/ShopHero.tsx` — hero showcase with trust highlights and spotlight card.
- `ui/ShopFilterBar.tsx` — search, store/sort selects, category and brand filters.
- `ui/ShopTrustSection.tsx` — physical store / hours / contact block.
- `ui/ShopProductCard.tsx` — one product tile.
- `lib/catalog.ts` — pure brand extraction, filter+sort, spotlight pick, `SortOption`.
