export type NavItem = {
  to: string;
  label: string;
  description: string;
};

export const primaryNavItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", description: "Overview and alerts" },
  { to: "/inventory", label: "Inventory", description: "Products, lots, and stock levels" },
  { to: "/invoices", label: "Invoices", description: "Drafts, finalized sales, and void flow" },
  { to: "/payments", label: "Payments", description: "Receipts and collections" },
  { to: "/reports", label: "Reports", description: "Operational exports" },
  { to: "/stock-movements", label: "Stock Movements", description: "Inventory trace history" },
];

