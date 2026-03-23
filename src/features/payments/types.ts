import type { Invoice, InvoicePayment } from "../invoices/types";

export type PaymentRecord = InvoicePayment;

export type PaymentWithInvoice = PaymentRecord & {
  invoice: Invoice | null;
};

