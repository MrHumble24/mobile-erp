# Caldera UI Component Library (`@/shared/ui`)

> **Note for AI Agents & Developers**:
> All base components for the mobile retail ERP POS have been created in advance inside `client/src/shared/ui/`. They are 100% compliant with Feature-Sliced Design (zero business logic, pure presentation), styled to the Caldera Design System (volcanic molten ember, warm limestone, unshadowed flat architecture, roomy spacing), and ready to use in Waves F1 and F2.
>
> If your slice needs additional variants, props, or adjustments, **you can freely modify or extend them**.

---

## Available Components (`@/shared/ui`)

| Component | File | Description & Caldera Roles |
| :--- | :--- | :--- |
| **`Button`** | `button.tsx` | Main actions, CTAs. Variants: `default` (Ember fill, Obsidian text), `secondary` (Limestone), `outline`, `pillOutline`, `ghost`, `destructive`. Sizes: `sm` (48px), `default` (56px), `lg` (64px), `icon`. |
| **`Input`** | `input.tsx` | 100px full pill input, 56px height, roomy padding. Variants: `light` (limestone), `dark` (for obsidian sections). |
| **`BarcodeInput`** | `barcode-input.tsx` | Optimized for USB/Bluetooth 1D/2D HID barcode & IMEI scanners. Dispatches `onScan` on enter, includes clear button and scan icon. |
| **`Label`** | `label.tsx` | DM Sans 500 label, micro-tracked uppercase text with optional tag `(ixtiyoriy)`. |
| **`Select`** | `select.tsx` | Pill-shaped trigger, Base UI dropdown, chevron and check indicators. |
| **`Textarea`** | `textarea.tsx` | 24px radius textarea with light and dark variants. |
| **`Checkbox`** | `checkbox.tsx` | Base UI accessible checkbox with 8px radius and Ember checkmark. |
| **`Switch`** | `switch.tsx` | Accessible pill toggle with smooth Obsidian thumb and Ember active state. |
| **`Dialog`** | `dialog.tsx` | Modal with 40px radius limestone card, blurred backdrop, title, description, and close button. |
| **`Sheet`** | `sheet.tsx` | Slide-over drawer (right, left, or bottom) with 40px radius. Ideal for IMEI history, receipt preview, and device inspection. |
| **`DropdownMenu`** | `dropdown-menu.tsx` | Floating menu with 24px radius, dotted dividers, and item highlight states. |
| **`Table`** | `table.tsx` | Roomy table container with dotted borders, generous cell padding (py-6 px-8), header, footer, and caption. |
| **`Badge`** | `badge.tsx` | 800px full pill status badges. Variants: `sulfur` (#f5f28e for categories/tags), `ember` (#fc5000), `limestone` (#f7f6f2), `dark` (#070607), `plasma` (#524ae9), `outline`. |
| **`Card`** | `card.tsx` | 40px radius cards with variants: `limestone` (default content block), `ember` (stat callouts), `plasma` (halftone hero card), `dark` (high-contrast section), `pumice`. |
| **`MetricCard`** | `metric-card.tsx` | High-impact stat feature card with giant Bebas Neue metric numbers and DM Sans 500 labels. Its value shrinks to fit one line (down to a 0.4 floor) so a 13-digit amount never overflows or clips the card — no caller change needed. |
| **`Money`** | `money.tsx` | Renders a money amount on one line with tabular digits, never wrapping. Default is the exact figure (use in tables, receipts, forms, lists — anything counted). With `headline`, it shrinks to fit and, only past the legible floor, switches to a short form (`$19.05M`) with the exact amount in a tooltip. See ADR 0048. |
| **`Tabs`** | `tabs.tsx` | Segmented pill container (`TabsList`) with pill triggers (`TabsTrigger`) and smooth active Ember state. |
| **`Form`** | `form.tsx` | Full React Hook Form + Zod integration (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`). |
| **`Toaster` / `toast`** | `sonner.tsx` | Sonner toast alerts with Caldera styling for offline sync alerts, low-stock warnings, and sale confirmations. |
| **`Skeleton`** | `skeleton.tsx` | Animated pulsing placeholder (`pill`, `card`, `circle`, `default`) for loading and sync states. |
| **`Separator`** | `separator.tsx` | Horizontal and vertical solid or dotted dividers (`divider-dotted-h`, `divider-dotted-v`). |
| **`Tooltip`** | `tooltip.tsx` | Accessible hover tooltip with pill styling, Obsidian surface, and Chalk text. |
| **`Command`** | `command.tsx` | `cmdk` palette for rapid search, keyboard shortcuts, and POS navigation. |
| **`Popover`** | `popover.tsx` | Floating popover with 24px radius for datepickers, quick filters, and secondary details. |
| **`ScrollArea`** | `scroll-area.tsx` | Smooth scrollable area with custom Ember-highlighted scrollbars. |

---

## Usage Example

```tsx
import { 
  Button, 
  Input, 
  BarcodeInput, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Badge, 
  Table 
} from "@/shared/ui"
import { Plus } from "lucide-react"

export function DeviceListing() {
  return (
    <Card variant="limestone">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="sulfur">OMBORDA</Badge>
          <Button variant="default" size="sm">
            <Plus className="size-4" />
            <span>YANGI QABUL</span>
          </Button>
        </div>
        <CardTitle>QURILMALAR ROYXATI</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Table content here */}
      </CardContent>
    </Card>
  )
}
```

---

## Rules for Agents
1. **Import Seam**: Always import from `@/shared/ui`. Never import from internal paths like `@/shared/ui/button`.
2. **Layer Isolation**: Keep `src/shared/ui/` pure and business-agnostic. Business-specific components (e.g. `DeviceStatusBadge`, `NasiyaLedgerCard`) belong in their respective FSD slices (`entities/device/ui`, `entities/consignment/ui`, `widgets/pos-terminal/ui`).
3. **Modifications Allowed**: Agents may add new variants, props, or composite helpers to `src/shared/ui/` as long as files remain under 300 lines and pass `oxlint` and TypeScript checks.
