import { normalizeInvoice, normalizeInvoicePayment } from "../invoices/utils";
import type { PaymentWithInvoice } from "./types";

export function buildReceiptNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `RCPT-${datePart}-${randomPart}`;
}

export function normalizePaymentWithInvoice(record: Record<string, unknown>): PaymentWithInvoice {
  const payment = normalizeInvoicePayment(record);
  const invoiceRecord = record.invoices && typeof record.invoices === "object" ? normalizeInvoice(record.invoices as Record<string, unknown>) : null;

  return {
    ...payment,
    invoice: invoiceRecord,
  };
}

