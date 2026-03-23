import { matchPath, useLocation } from "react-router-dom";

const matchers = [
  { path: "/dashboard", title: "Dashboard", subtitle: "Business overview and alerts" },
  { path: "/inventory", title: "Inventory", subtitle: "Products, lots, and stock balance" },
  { path: "/inventory/new", title: "New Inventory Item", subtitle: "Prepare the stock entry form" },
  { path: "/inventory/:id/edit", title: "Edit Inventory Item", subtitle: "Update lot details and stock data" },
  { path: "/invoices", title: "Sales Invoices", subtitle: "Draft, finalize, and void flow" },
  { path: "/invoices/new", title: "New Invoice", subtitle: "Prepare the draft invoice editor" },
  { path: "/invoices/:id/edit", title: "Edit Draft Invoice", subtitle: "Review and update the invoice draft" },
  { path: "/invoices/:id", title: "Invoice Detail", subtitle: "Printable invoice and activity summary" },
  { path: "/payments", title: "Payments", subtitle: "Collections and receipt records" },
  { path: "/receipts/:paymentId", title: "Receipt", subtitle: "Printable receipt preview" },
  { path: "/reports", title: "Reports", subtitle: "Operational exports and summaries" },
  { path: "/stock-movements", title: "Stock Movement Log", subtitle: "Traceability and stock history" },
];

export function useRouteDisplay() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    matchers.find((item) => matchPath({ path: item.path, end: true }, pathname)) ?? {
      title: "Dashboard",
      subtitle: "Business overview and alerts",
    }
  );
}
