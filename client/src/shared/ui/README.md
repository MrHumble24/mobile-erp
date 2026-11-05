# Shared UI Kit (`shared/ui`)

Caldera design system primitives for the mobile retail ERP client.

## What it owns
- Generic, business-agnostic UI primitives: Button, Input, BarcodeInput, Select, Combobox, Textarea, Checkbox, Switch, Dialog, Sheet, DropdownMenu, Table, Badge, Card, MetricCard, Tabs, Form, Sonner (Toast), Skeleton, Separator, Tooltip, Command, Popover, ScrollArea, AssetImage, FilePicker.
- `AssetImage`: the single wrapped `<img>`. Props `{ path, alt, className, iconClassName }`; resolves a server-relative `/uploads/...` path against the API base (`shared/api/http`'s `apiAssetUrl`) and shows a neutral icon placeholder when `path` is null.
- `FilePicker`: the single wrapped file `<input>`. Props `{ accept, disabled, onPick, children }`; a single trigger child (e.g. a Button) opens the native picker and `onPick(file)` fires with the chosen file.
- `Combobox`: single-value searchable select (Popover + cmdk). Props `{ value, onChange, options, placeholder, searchPlaceholder, emptyText, disabled, className, allowCreate?, onCreate? }`. Trigger mirrors `SelectTrigger`; closes on select, clears the query on Escape/close.
- Caldera theme styles: Ember (#fc5000), Limestone (#f7f6f2), Pumice (#e2e2df), Obsidian (#070607), Chalk (#ffffff), Sulfur (#f5f28e), Plasma Violet (#524ae9).
- Pill controls (`rounded-[800px]`), 40px cards, 100px inputs, and roomy spacing.

## Public API
Import from `@/shared/ui`:
```tsx
import { Button, Input, Card, Badge, Dialog, Table, Form } from "@/shared/ui"
```

## Invariants & Rules
- Zero business words (no device, sale, IMEI, partner logic).
- Native form elements (`<button>`, `<input>`, etc.) are forbidden outside this folder.
- All files must stay strictly under 300 lines.
- Modifiable by any agent building feature or entity slices as requirements evolve.
