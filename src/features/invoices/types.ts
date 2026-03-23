import type { Database } from "../../types/database";

export type Invoice = Omit<Database["public"]["Tables"]["invoices"]["Row"], "subtotal" | "total"> & {
  subtotal: number;
  total: number;
};

export type InvoiceLineItem = Omit<Database["public"]["Tables"]["invoice_items"]["Row"], "unit_price" | "line_total"> & {
  unit_price: number;
  line_total: number;
};

export type InvoicePayment = Omit<Database["public"]["Tables"]["payments"]["Row"], "amount_paid"> & {
  amount_paid: number;
};

export type InvoiceDetail = Invoice & {
  invoice_items: InvoiceLineItem[];
  payments: InvoicePayment[];
};

export type InvoiceStatus = Invoice["status"];

export type InvoiceStatusFilter = "all" | InvoiceStatus;

export type InvoicePaymentStatus = "Unpaid" | "Partially Paid" | "Paid";
