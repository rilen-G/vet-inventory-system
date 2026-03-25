import { getSupabaseClient } from "../../lib/supabase";
import type { Database } from "../../types/database";
import { roundCurrency } from "../../lib/utils";
import { normalizeInvoicePayment } from "../invoices/utils";
import type { PaymentFormValues } from "./schemas";
import { buildReceiptNumber, normalizePaymentWithInvoice } from "./utils";

export async function listPaymentsWithInvoices() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, invoices(*)")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((payment) => normalizePaymentWithInvoice(payment as unknown as Record<string, unknown>));
}

export async function getPaymentDetail(paymentId: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, invoices(*)")
    .eq("id", paymentId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePaymentWithInvoice(data as unknown as Record<string, unknown>);
}

export async function recordPayment(invoiceId: number, values: PaymentFormValues) {
  const supabase = getSupabaseClient();
  const receiptNumber = buildReceiptNumber();
  const { data, error } = await supabase.rpc("record_payment", {
    p_invoice_id: invoiceId,
    p_receipt_number: receiptNumber,
    p_payment_date: values.payment_date,
    p_payment_method: values.payment_method,
    p_amount_paid: roundCurrency(values.amount_paid),
    p_notes: values.notes ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeInvoicePayment(data as unknown as Record<string, unknown>);
}
