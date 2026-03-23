import { toNumber } from "../../lib/utils";
import type { InventoryItem, InventoryStatus, InventoryStatusFilter, StockMovement, StockMovementActivity } from "./types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function normalizeInventoryItem(record: Record<string, unknown>): InventoryItem {
  return {
    id: toNumber(record.id),
    item_name: String(record.item_name ?? ""),
    company_category: record.company_category ? String(record.company_category) : null,
    lot_number: String(record.lot_number ?? ""),
    expiration_date: String(record.expiration_date ?? ""),
    stock_quantity: toNumber(record.stock_quantity),
    low_stock_threshold: toNumber(record.low_stock_threshold),
    unit_price: toNumber(record.unit_price),
    notes: record.notes ? String(record.notes) : null,
    created_at: record.created_at ? String(record.created_at) : null,
    updated_at: record.updated_at ? String(record.updated_at) : null,
  };
}

export function normalizeStockMovement(record: Record<string, unknown>): StockMovement {
  return {
    id: toNumber(record.id),
    inventory_item_id: toNumber(record.inventory_item_id),
    movement_type: String(record.movement_type ?? "") as StockMovement["movement_type"],
    quantity: toNumber(record.quantity),
    reference_type: record.reference_type ? String(record.reference_type) : null,
    reference_id: record.reference_id === null || record.reference_id === undefined ? null : toNumber(record.reference_id),
    notes: record.notes ? String(record.notes) : null,
    created_at: record.created_at ? String(record.created_at) : null,
  };
}

export function normalizeStockMovementActivity(record: Record<string, unknown>): StockMovementActivity {
  const stockMovement = normalizeStockMovement(record);
  const inventoryRecord =
    record.inventory_items && typeof record.inventory_items === "object"
      ? (record.inventory_items as Record<string, unknown>)
      : null;

  return {
    ...stockMovement,
    item_name: inventoryRecord?.item_name ? String(inventoryRecord.item_name) : null,
    lot_number: inventoryRecord?.lot_number ? String(inventoryRecord.lot_number) : null,
  };
}

export function isExpired(expirationDate: string) {
  return startOfDay(new Date(expirationDate)).getTime() < startOfDay(new Date()).getTime();
}

export function isNearExpiry(expirationDate: string) {
  if (isExpired(expirationDate)) {
    return false;
  }

  const expiration = startOfDay(new Date(expirationDate)).getTime();
  const today = startOfDay(new Date()).getTime();
  const diffInDays = Math.ceil((expiration - today) / DAY_IN_MS);

  return diffInDays <= 60;
}

export function isLowStock(item: Pick<InventoryItem, "stock_quantity" | "low_stock_threshold">) {
  return item.stock_quantity <= item.low_stock_threshold;
}

export function getInventoryStatus(item: InventoryItem): InventoryStatus {
  if (isExpired(item.expiration_date)) {
    return "Expired";
  }

  if (isLowStock(item)) {
    return "Low Stock";
  }

  if (isNearExpiry(item.expiration_date)) {
    return "Near Expiry";
  }

  return "In Stock";
}

export function matchesInventoryFilter(item: InventoryItem, filter: InventoryStatusFilter) {
  switch (filter) {
    case "low-stock":
      return getInventoryStatus(item) === "Low Stock";
    case "near-expiry":
      return getInventoryStatus(item) === "Near Expiry";
    case "expired":
      return getInventoryStatus(item) === "Expired";
    default:
      return true;
  }
}

export function inventoryStatusTone(status: InventoryStatus) {
  switch (status) {
    case "Expired":
      return "danger";
    case "Low Stock":
      return "warning";
    case "Near Expiry":
      return "info";
    default:
      return "success";
  }
}

export function describeMovementQuantity(movement: StockMovement) {
  const isPositive = movement.movement_type === "STOCK_IN" || movement.movement_type === "VOID_REVERSAL" || movement.quantity > 0;

  return `${isPositive ? "+" : ""}${movement.quantity}`;
}
