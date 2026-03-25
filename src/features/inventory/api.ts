import { getSupabaseClient } from "../../lib/supabase";
import type { Database } from "../../types/database";
import type { InventoryItemFormValues, StockAdjustmentValues } from "./schemas";
import { normalizeInventoryItem, normalizeStockMovement, normalizeStockMovementActivity } from "./utils";

type InventoryInsert = Database["public"]["Tables"]["inventory_items"]["Insert"];
type InventoryUpdate = Database["public"]["Tables"]["inventory_items"]["Update"];

type ListInventoryItemsOptions = {
  includeArchived?: boolean;
};

function cleanText(value?: string | null) {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

function isMissingArchivedColumnError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message ?? "";

  return (
    error.code === "42703" ||
    /inventory_items\.is_archived/i.test(message) ||
    (/is_archived/i.test(message) && /inventory_items/i.test(message) && /schema cache/i.test(message))
  );
}

function toInventoryPayload(values: InventoryItemFormValues): InventoryInsert {
  return {
    item_name: values.item_name.trim(),
    company_category: values.company_category.trim(),
    lot_number: values.lot_number.trim(),
    expiration_date: values.expiration_date,
    stock_quantity: values.stock_quantity,
    low_stock_threshold: values.low_stock_threshold,
    unit_price: values.unit_price,
    is_archived: false,
    notes: cleanText(values.notes),
  };
}

export async function listInventoryItems(options: ListInventoryItemsOptions = {}) {
  const supabase = getSupabaseClient();
  let query = supabase.from("inventory_items").select("*");

  if (options.includeArchived) {
    query = query.order("is_archived", { ascending: true });
  } else {
    query = query.eq("is_archived", false);
  }

  query = query.order("item_name", { ascending: true }).order("expiration_date", { ascending: true });

  let { data, error } = await query;

  if (isMissingArchivedColumnError(error)) {
    const fallbackResult = await supabase
      .from("inventory_items")
      .select("*")
      .order("item_name", { ascending: true })
      .order("expiration_date", { ascending: true });

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => normalizeInventoryItem(item as unknown as Record<string, unknown>));
}

export async function getInventoryItem(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("inventory_items").select("*").eq("id", id).single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInventoryItem(data as unknown as Record<string, unknown>);
}

export async function listInventoryMovements(inventoryItemId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("inventory_item_id", inventoryItemId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((movement) => normalizeStockMovement(movement as unknown as Record<string, unknown>));
}

export async function listRecentStockMovements() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*, inventory_items(item_name, lot_number)")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((movement) => normalizeStockMovementActivity(movement as unknown as Record<string, unknown>));
}

export async function listStockMovements() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*, inventory_items(item_name, lot_number)")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((movement) => normalizeStockMovementActivity(movement as unknown as Record<string, unknown>));
}

export async function createInventoryItem(values: InventoryItemFormValues) {
  const supabase = getSupabaseClient();
  const payload = toInventoryPayload(values);
  const { data, error } = await supabase.from("inventory_items").insert(payload).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInventoryItem(data as unknown as Record<string, unknown>);
}

export async function updateInventoryItem(id: number, values: InventoryItemFormValues) {
  const supabase = getSupabaseClient();
  const { data: currentItem, error: currentItemError } = await supabase
    .from("inventory_items")
    .select("stock_quantity")
    .eq("id", id)
    .single();

  if (currentItemError) {
    throw new Error(currentItemError.message);
  }

  const targetStockQuantity = values.stock_quantity;
  const stockDelta = targetStockQuantity - Number(currentItem.stock_quantity ?? 0);
  const payload: InventoryUpdate = {
    item_name: values.item_name.trim(),
    company_category: values.company_category.trim(),
    lot_number: values.lot_number.trim(),
    expiration_date: values.expiration_date,
    low_stock_threshold: values.low_stock_threshold,
    unit_price: values.unit_price,
    notes: cleanText(values.notes),
  };

  const { error } = await supabase.from("inventory_items").update(payload).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  if (stockDelta !== 0) {
    const { error: movementError } = await supabase.from("stock_movements").insert({
      inventory_item_id: id,
      movement_type: "ADJUSTMENT",
      quantity: stockDelta,
      reference_type: "ITEM_EDIT",
      reference_id: id,
      notes: `Stock updated from item edit screen to ${targetStockQuantity}.`,
    });

    if (movementError) {
      throw new Error(movementError.message);
    }
  }

  const { data: refreshedItem, error: refreshedItemError } = await supabase.from("inventory_items").select("*").eq("id", id).single();

  if (refreshedItemError) {
    throw new Error(refreshedItemError.message);
  }

  return normalizeInventoryItem(refreshedItem as unknown as Record<string, unknown>);
}

export async function setInventoryItemArchived(id: number, isArchived: boolean) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .update({ is_archived: isArchived })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (isMissingArchivedColumnError(error)) {
      throw new Error("Archive is not available yet. Run the latest Supabase schema update first.");
    }
    throw new Error(error.message);
  }

  return normalizeInventoryItem(data as unknown as Record<string, unknown>);
}

export async function adjustInventoryStock(inventoryItemId: number, values: StockAdjustmentValues) {
  const supabase = getSupabaseClient();
  const signedQuantity = values.adjustment_type === "increase" ? values.quantity : values.quantity * -1;

  const { data, error } = await supabase
    .from("stock_movements")
    .insert({
      inventory_item_id: inventoryItemId,
      movement_type: "ADJUSTMENT",
      quantity: signedQuantity,
      reference_type: "MANUAL_ADJUSTMENT",
      reference_id: inventoryItemId,
      notes: cleanText(values.notes) ?? `Manual stock ${values.adjustment_type}.`,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeStockMovement(data as unknown as Record<string, unknown>);
}
