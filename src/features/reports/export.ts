import * as XLSX from "xlsx";

import { formatCurrency, formatDate } from "../../lib/utils";
import type { InvoiceDetail } from "../invoices/types";
import { getInvoiceBalance, getInvoicePaidTotal, getInvoicePaymentStatus } from "../invoices/utils";
import type { InventoryItem } from "../inventory/types";
import { getInventoryStatus, isExpired, isLowStock, isNearExpiry } from "../inventory/utils";
import type { PaymentWithInvoice } from "../payments/types";

type ExportReportsArgs = {
  inventoryItems: InventoryItem[];
  invoices: InvoiceDetail[];
  payments: PaymentWithInvoice[];
};

export function exportReportsWorkbook({ inventoryItems, invoices, payments }: ExportReportsArgs) {
  const workbook = XLSX.utils.book_new();

  const inventoryRows = inventoryItems.map((item) => ({
    "Item Name": item.item_name,
    Category: item.company_category ?? "",
    "Lot Number": item.lot_number,
    "Expiration Date": formatDate(item.expiration_date),
    "Stock Quantity": item.stock_quantity,
    "Low Stock Threshold": item.low_stock_threshold,
    "Unit Price": item.unit_price,
    Status: getInventoryStatus(item),
  }));

  const lowStockRows = inventoryItems.filter((item) => isLowStock(item)).map((item) => ({
    "Item Name": item.item_name,
    Category: item.company_category ?? "",
    "Lot Number": item.lot_number,
    "Stock Quantity": item.stock_quantity,
    "Low Stock Threshold": item.low_stock_threshold,
    Status: getInventoryStatus(item),
  }));

  const expiryRows = inventoryItems.filter((item) => isNearExpiry(item.expiration_date) || isExpired(item.expiration_date)).map((item) => ({
    "Item Name": item.item_name,
    "Lot Number": item.lot_number,
    "Expiration Date": formatDate(item.expiration_date),
    Status: isExpired(item.expiration_date) ? "Expired" : "Near Expiry",
    "Stock Quantity": item.stock_quantity,
  }));

  const invoiceRows = invoices.map((invoice) => ({
    "Invoice Number": invoice.invoice_number,
    Customer: invoice.customer_name,
    "Invoice Date": formatDate(invoice.invoice_date),
    "Due Date": invoice.due_date ? formatDate(invoice.due_date) : "",
    Status: invoice.status,
    "Payment Status": getInvoicePaymentStatus(invoice),
    Total: invoice.total,
    "Paid Total": getInvoicePaidTotal(invoice),
    Balance: getInvoiceBalance(invoice),
  }));

  const paymentRows = payments.map((payment) => ({
    "Receipt Number": payment.receipt_number,
    "Invoice Number": payment.invoice?.invoice_number ?? "",
    Customer: payment.invoice?.customer_name ?? "",
    "Payment Date": formatDate(payment.payment_date),
    "Payment Method": payment.payment_method,
    "Amount Paid": payment.amount_paid,
  }));

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(inventoryRows), "Inventory");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(lowStockRows), "Low Stock");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expiryRows), "Expiry");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(invoiceRows), "Invoices");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(paymentRows), "Payments");

  XLSX.writeFile(workbook, `operations-reports-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
