import type { Database } from "../../types/database";

export type InventoryItem = Omit<Database["public"]["Tables"]["inventory_items"]["Row"], "unit_price"> & {
  unit_price: number;
};

export type StockMovement = Database["public"]["Tables"]["stock_movements"]["Row"];

export type StockMovementActivity = StockMovement & {
  item_name: string | null;
  lot_number: string | null;
};

export type InventoryStatus = "In Stock" | "Low Stock" | "Near Expiry" | "Expired";

export type InventoryStatusFilter = "all" | "low-stock" | "near-expiry" | "expired";

export type InventoryAvailabilityFilter = "active" | "archived" | "all";
