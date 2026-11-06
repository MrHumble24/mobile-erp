import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router"
import { AppShell } from "@/widgets/app-shell"
import { RequirePermission } from "./require-permission"
import { useSetupStatus } from "@/entities/company"

const LoginPage = lazy(() => import("@/pages/login"))
const SetupWizardPage = lazy(() => import("@/pages/setup"))
const DashboardPage = lazy(() => import("@/pages/dashboard"))
const PosPage = lazy(() => import("@/pages/pos"))
const InventoryPage = lazy(() => import("@/pages/inventory"))
const StockPage = lazy(() => import("@/pages/stock"))
const ShipmentsPage = lazy(() => import("@/pages/shipments"))
const QcPage = lazy(() => import("@/pages/qc"))
const SalesPage = lazy(() => import("@/pages/sales"))
const SaleReceiptPage = lazy(() => import("@/pages/sales/ui/SaleReceiptPage"))
const CustomersPage = lazy(() => import("@/pages/customers"))
const PurchasesPage = lazy(() => import("@/pages/purchases"))
const CreditsPage = lazy(() => import("@/pages/credits"))
const CreditContractPage = lazy(() =>
  import("@/pages/credits").then((m) => ({ default: m.CreditContractPage }))
)
const ShiftsPage = lazy(() => import("@/pages/shifts"))
const RepairsPage = lazy(() => import("@/pages/repairs"))
const RepairTicketPage = lazy(() =>
  import("@/pages/repairs").then((m) => ({ default: m.RepairTicketPage }))
)
const ConsignmentsPage = lazy(() => import("@/pages/consignments"))
const PartnersPage = lazy(() => import("@/pages/partners"))
const ExpensesPage = lazy(() => import("@/pages/expenses"))
const BalancePage = lazy(() => import("@/pages/balance"))
const CustomsPage = lazy(() => import("@/pages/customs"))
const ReportsPage = lazy(() => import("@/pages/reports"))
const StoresPage = lazy(() => import("@/pages/stores"))
const TransfersPage = lazy(() => import("@/pages/transfers"))
const UsersPage = lazy(() => import("@/pages/users"))
const SyncPage = lazy(() => import("@/pages/sync"))
const SettingsPage = lazy(() => import("@/pages/settings"))
const ShopPage = lazy(() => import("@/pages/shop"))
const ShopDetailPage = lazy(() => import("@/pages/shop-detail"))
const ShopOrderPage = lazy(() => import("@/pages/shop-order"))
const OrdersPage = lazy(() => import("@/pages/orders"))
const BackupsPage = lazy(() => import("@/pages/backups"))

function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

function ProtectedRoutes() {
  return (
    <Route element={<RequirePermission />}>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route element={<RequirePermission permission="sale.create" />}>
          <Route path="/pos" element={<PosPage />} />
        </Route>
        <Route element={<RequirePermission permission="device.read" />}>
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/stock" element={<StockPage />} />
        </Route>
        <Route element={<RequirePermission permission="transfer.read" />}>
          <Route path="/transfers" element={<TransfersPage />} />
        </Route>
        <Route element={<RequirePermission permission="shipment.read" />}>
          <Route path="/shipments" element={<ShipmentsPage />} />
        </Route>
        <Route element={<RequirePermission permission="qc.read" />}>
          <Route path="/qc" element={<QcPage />} />
        </Route>
        <Route element={<RequirePermission permission="sale.read" />}>
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/:id/receipt" element={<SaleReceiptPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/credits/:id/contract" element={<CreditContractPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
        </Route>
        <Route element={<RequirePermission permission="repair.read" />}>
          <Route path="/repairs" element={<RepairsPage />} />
          <Route path="/repairs/:id/ticket" element={<RepairTicketPage />} />
        </Route>
        <Route element={<RequirePermission permission="customer.read" />}>
          <Route path="/customers" element={<CustomersPage />} />
        </Route>
        <Route element={<RequirePermission permission="purchase.read" />}>
          <Route path="/purchases" element={<PurchasesPage />} />
        </Route>
        <Route element={<RequirePermission permission="consignment.read" />}>
          <Route path="/consignments" element={<ConsignmentsPage />} />
        </Route>
        <Route element={<RequirePermission permission="partner.read" />}>
          <Route path="/partners" element={<PartnersPage />} />
        </Route>
        <Route element={<RequirePermission permission="expense.read" />}>
          <Route path="/expenses" element={<ExpensesPage />} />
        </Route>
        <Route element={<RequirePermission permission="balance.read" />}>
          <Route path="/balance" element={<BalancePage />} />
        </Route>
        <Route element={<RequirePermission permission="customs.read" />}>
          <Route path="/customs" element={<CustomsPage />} />
        </Route>
        <Route element={<RequirePermission permission="report.finance" />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route element={<RequirePermission permission="user.manage" />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
        <Route element={<RequirePermission permission="store.manage" />}>
          <Route path="/stores" element={<StoresPage />} />
        </Route>
        <Route element={<RequirePermission permission="sync.resolve" />}>
          <Route path="/sync" element={<SyncPage />} />
        </Route>
        <Route element={<RequirePermission permission="order.read" />}>
          <Route path="/orders" element={<OrdersPage />} />
        </Route>
        <Route element={<RequirePermission permission="settings.manage" />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route element={<RequirePermission permission="backup.read" />}>
          <Route path="/backups" element={<BackupsPage />} />
        </Route>
      </Route>
    </Route>
  )
}

export function AppRoutes() {
  const { data: setupStatus, isLoading } = useSetupStatus()

  if (isLoading) {
    return <SuspenseFallback />
  }

  if (setupStatus?.needsSetup) {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path="*" element={<SetupWizardPage />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/order/:id" element={<ShopOrderPage />} />
        <Route path="/shop/:modelId" element={<ShopDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        {ProtectedRoutes()}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
