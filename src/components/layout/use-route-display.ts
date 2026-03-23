import { matchPath, useLocation } from "react-router-dom";

const matchers = [
  { path: "/dashboard", title: "Dashboard", subtitle: "" },
  { path: "/inventory", title: "Inventory", subtitle: "" },
  { path: "/inventory/new", title: "New Inventory Item", subtitle: "" },
  { path: "/inventory/:id/edit", title: "Edit Inventory Item", subtitle: "" },
  { path: "/invoices", title: "Sales Invoices", subtitle: "" },
  { path: "/invoices/new", title: "New Invoice", subtitle: "" },
  { path: "/invoices/:id/edit", title: "Edit Draft Invoice", subtitle: "" },
  { path: "/invoices/:id", title: "Invoice Detail", subtitle: "" },
  { path: "/payments", title: "Payments", subtitle: "" },
  { path: "/receipts/:paymentId", title: "Receipt", subtitle: "" },
  { path: "/reports", title: "Reports", subtitle: "" },
  { path: "/stock-movements", title: "Stock Movement Log", subtitle: "" },
];

export function useRouteDisplay() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    matchers.find((item) => matchPath({ path: item.path, end: true }, pathname)) ?? {
      title: "Dashboard",
      subtitle: "",
    }
  );
}
