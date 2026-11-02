import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router"
import { AppShell } from "@/widgets/app-shell"
import { RequirePermission } from "./require-permission"

const LoginPage = lazy(() => import("@/pages/login"))
const DashboardPage = lazy(() => import("@/pages/dashboard"))
const PosPage = lazy(() => import("@/pages/pos"))
const InventoryPage = lazy(() => import("@/pages/inventory"))
const ShipmentsPage = lazy(() => import("@/pages/shipments"))
const QcPage = lazy(() => import("@/pages/qc"))
const SalesPage = lazy(() => import("@/pages/sales"))
const SaleReceiptPage = lazy(() => import("@/pages/sales/ui/SaleReceiptPage"))
const CustomersPage = lazy(() => import("@/pages/customers"))
const ConsignmentsPage = lazy(() => import("@/pages/consignments"))
const PartnersPage = lazy(() => import("@/pages/partners"))
const ExpensesPage = lazy(() => import("@/pages/expenses"))
const ReportsPage = lazy(() => import("@/pages/reports"))
const UsersPage = lazy(() => import("@/pages/users"))
const SettingsPage = lazy(() => import("@/pages/settings"))

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
        </Route>
        <Route element={<RequirePermission permission="customer.read" />}>
          <Route path="/customers" element={<CustomersPage />} />
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
        <Route element={<RequirePermission permission="report.finance" />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route element={<RequirePermission permission="user.manage" />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
        <Route element={<RequirePermission permission="settings.manage" />}>
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Route>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {ProtectedRoutes()}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
