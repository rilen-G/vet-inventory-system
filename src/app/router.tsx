import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppShell } from "../components/layout/app-shell";
import { DashboardPage } from "../pages/DashboardPage";
import { InventoryFormPage } from "../pages/InventoryFormPage";
import { InventoryListPage } from "../pages/InventoryListPage";
import { InvoiceDetailPage } from "../pages/InvoiceDetailPage";
import { InvoiceEditorPage } from "../pages/InvoiceEditorPage";
import { InvoiceListPage } from "../pages/InvoiceListPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PaymentsPage } from "../pages/PaymentsPage";
import { ReceiptPage } from "../pages/ReceiptPage";
import { ReportsPage } from "../pages/ReportsPage";
import { StockMovementsPage } from "../pages/StockMovementsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "inventory", element: <InventoryListPage /> },
      { path: "inventory/new", element: <InventoryFormPage mode="create" /> },
      { path: "inventory/:id/edit", element: <InventoryFormPage mode="edit" /> },
      { path: "invoices", element: <InvoiceListPage /> },
      { path: "invoices/new", element: <InvoiceEditorPage mode="create" /> },
      { path: "invoices/:id", element: <InvoiceDetailPage /> },
      { path: "invoices/:id/edit", element: <InvoiceEditorPage mode="edit" /> },
      { path: "payments", element: <PaymentsPage /> },
      { path: "receipts/:paymentId", element: <ReceiptPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "stock-movements", element: <StockMovementsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

