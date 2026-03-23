import { getSupabaseClient } from "../../lib/supabase";
import type { InventoryItem } from "../inventory/types";
import type { Database } from "../../types/database";
import type { InvoiceFormValues } from "./schemas";
import { buildInvoiceNumber, calculateInvoiceTotals, normalizeInvoice, normalizeInvoiceDetail } from "./utils";

type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];

function cleanText(value?: string | null) {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

async function getInventorySnapshotMap(inventoryItemIds: number[]) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, item_name, lot_number, unit_price, stock_quantity")
    .in("id", inventoryItemIds);

  if (error) {
    throw new Error(error.message);
  }

  const snapshotMap = new Map<number, InventoryItem>();

  for (const item of data ?? []) {
    snapshotMap.set(item.id as number, item as InventoryItem);
  }

  return snapshotMap;
}

function toInvoicePayload(values: InvoiceFormValues, invoiceNumber: string): InvoiceInsert {
  const totals = calculateInvoiceTotals(values.line_items);

  return {
    invoice_number: invoiceNumber,
    customer_name: values.customer_name.trim(),
    customer_address: cleanText(values.customer_address),
    customer_contact: cleanText(values.customer_contact),
    invoice_date: values.invoice_date,
    due_date: cleanText(values.due_date),
    status: "Draft",
    subtotal: totals.subtotal,
    total: totals.total,
    notes: cleanText(values.notes),
    void_reason: null,
  };
}

async function buildInvoiceItemsPayload(invoiceId: number, values: InvoiceFormValues) {
  const inventoryItemIds = values.line_items.map((item) => item.inventory_item_id);
  const snapshotMap = await getInventorySnapshotMap(inventoryItemIds);

  return values.line_items.map((lineItem) => {
    const selectedItem = snapshotMap.get(lineItem.inventory_item_id);

    if (!selectedItem) {
      throw new Error("One of the selected inventory items could not be found.");
    }

    return {
      invoice_id: invoiceId,
      inventory_item_id: lineItem.inventory_item_id,
      item_name_snapshot: selectedItem.item_name,
      lot_number_snapshot: selectedItem.lot_number,
      quantity: lineItem.quantity,
      unit_price: lineItem.unit_price,
      line_total: lineItem.quantity * lineItem.unit_price,
    };
  });
}

export async function listInvoices() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*), payments(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((invoice) => normalizeInvoiceDetail(invoice as unknown as Record<string, unknown>));
}

export async function getInvoiceDetail(invoiceId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*), payments(*)")
    .eq("id", invoiceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInvoiceDetail(data as unknown as Record<string, unknown>);
}

export async function createDraftInvoice(values: InvoiceFormValues) {
  const supabase = getSupabaseClient();
  const invoiceNumber = buildInvoiceNumber();
  const payload = toInvoicePayload(values, invoiceNumber);
  const { data, error } = await supabase.from("invoices").insert(payload).select("*").single();

  if (error) {
    throw new Error(error.message);
  }

  const invoice = normalizeInvoice(data as unknown as Record<string, unknown>);

  const invoiceItemsPayload = await buildInvoiceItemsPayload(invoice.id, values);
  const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItemsPayload);

  if (itemsError) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    throw new Error(itemsError.message);
  }

  return invoice;
}

export async function updateDraftInvoice(invoiceId: number, values: InvoiceFormValues) {
  const supabase = getSupabaseClient();
  const payload: InvoiceUpdate = {
    customer_name: values.customer_name.trim(),
    customer_address: cleanText(values.customer_address),
    customer_contact: cleanText(values.customer_contact),
    invoice_date: values.invoice_date,
    due_date: cleanText(values.due_date),
    subtotal: calculateInvoiceTotals(values.line_items).subtotal,
    total: calculateInvoiceTotals(values.line_items).total,
    notes: cleanText(values.notes),
  };

  const { data, error } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", invoiceId)
    .eq("status", "Draft")
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const deleteResult = await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message);
  }

  const invoiceItemsPayload = await buildInvoiceItemsPayload(invoiceId, values);
  const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItemsPayload);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return normalizeInvoice(data as unknown as Record<string, unknown>);
}

export async function cancelDraftInvoice(invoiceId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "Cancelled" })
    .eq("id", invoiceId)
    .eq("status", "Draft")
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInvoice(data as unknown as Record<string, unknown>);
}

export async function finalizeInvoice(invoiceId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("finalize_invoice", {
    p_invoice_id: invoiceId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInvoice(data as unknown as Record<string, unknown>);
}

export async function voidInvoice(invoiceId: number, voidReason: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("void_invoice", {
    p_invoice_id: invoiceId,
    p_void_reason: voidReason,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInvoice(data as unknown as Record<string, unknown>);
}
