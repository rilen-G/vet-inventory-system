import { roundCurrency, toNumber } from "../../lib/utils";
import type { Invoice, InvoiceDetail, InvoiceLineItem, InvoicePayment, InvoicePaymentStatus, InvoiceStatus } from "./types";

export function normalizeInvoice(record: Record<string, unknown>): Invoice {
  return {
    id: toNumber(record.id),
    invoice_number: String(record.invoice_number ?? ""),
    customer_name: String(record.customer_name ?? ""),
    customer_address: record.customer_address ? String(record.customer_address) : null,
    customer_contact: record.customer_contact ? String(record.customer_contact) : null,
    invoice_date: String(record.invoice_date ?? ""),
    due_date: record.due_date ? String(record.due_date) : null,
    status: String(record.status ?? "Draft") as InvoiceStatus,
    subtotal: toNumber(record.subtotal),
    total: toNumber(record.total),
    notes: record.notes ? String(record.notes) : null,
    void_reason: record.void_reason ? String(record.void_reason) : null,
    created_at: record.created_at ? String(record.created_at) : null,
    updated_at: record.updated_at ? String(record.updated_at) : null,
  };
}

export function normalizeInvoiceLineItem(record: Record<string, unknown>): InvoiceLineItem {
  return {
    id: toNumber(record.id),
    invoice_id: toNumber(record.invoice_id),
    inventory_item_id: toNumber(record.inventory_item_id),
    item_name_snapshot: String(record.item_name_snapshot ?? ""),
    lot_number_snapshot: record.lot_number_snapshot ? String(record.lot_number_snapshot) : null,
    quantity: toNumber(record.quantity),
    unit_price: toNumber(record.unit_price),
    line_total: toNumber(record.line_total),
  };
}

export function normalizeInvoicePayment(record: Record<string, unknown>): InvoicePayment {
  return {
    id: toNumber(record.id),
    invoice_id: toNumber(record.invoice_id),
    receipt_number: String(record.receipt_number ?? ""),
    payment_date: String(record.payment_date ?? ""),
    payment_method: String(record.payment_method ?? "Cash") as InvoicePayment["payment_method"],
    amount_paid: toNumber(record.amount_paid),
    notes: record.notes ? String(record.notes) : null,
    created_at: record.created_at ? String(record.created_at) : null,
  };
}

export function normalizeInvoiceDetail(record: Record<string, unknown>): InvoiceDetail {
  const invoice = normalizeInvoice(record);
  const lineItems = Array.isArray(record.invoice_items)
    ? record.invoice_items.map((item) => normalizeInvoiceLineItem(item as Record<string, unknown>))
    : [];
  const payments = Array.isArray(record.payments)
    ? record.payments.map((payment) => normalizeInvoicePayment(payment as Record<string, unknown>))
    : [];

  return {
    ...invoice,
    invoice_items: lineItems.sort((left, right) => left.id - right.id),
    payments: payments.sort((left, right) => left.id - right.id),
  };
}

export function invoiceStatusTone(status: InvoiceStatus) {
  switch (status) {
    case "Finalized":
      return "success";
    case "Voided":
      return "danger";
    case "Cancelled":
      return "neutral";
    default:
      return "info";
  }
}

export function buildInvoiceNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `INV-${datePart}-${randomPart}`;
}

export function calculateInvoiceTotals(
  lineItems: Array<{
    quantity: number;
    unit_price: number;
  }>,
) {
  const subtotal = roundCurrency(lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0));

  return {
    subtotal,
    total: subtotal,
  };
}

export function getInvoicePaidTotal(invoice: Pick<InvoiceDetail, "payments">) {
  return roundCurrency(invoice.payments.reduce((sum, payment) => sum + payment.amount_paid, 0));
}

export function getInvoiceBalance(invoice: Pick<InvoiceDetail, "total" | "payments">) {
  return roundCurrency(Math.max(invoice.total - getInvoicePaidTotal(invoice), 0));
}

export function getInvoicePaymentStatus(invoice: Pick<InvoiceDetail, "total" | "payments">): InvoicePaymentStatus {
  const paidTotal = getInvoicePaidTotal(invoice);

  if (paidTotal <= 0) {
    return "Unpaid";
  }

  if (paidTotal >= invoice.total) {
    return "Paid";
  }

  return "Partially Paid";
}

export function invoicePaymentStatusTone(status: InvoicePaymentStatus) {
  switch (status) {
    case "Paid":
      return "success";
    case "Partially Paid":
      return "warning";
    default:
      return "neutral";
  }
}
