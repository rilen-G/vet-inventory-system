import jsPDF from "jspdf";

import { formatCurrency, formatDate } from "../../lib/utils";
import type { PaymentWithInvoice } from "./types";

export function downloadReceiptPdf(payment: PaymentWithInvoice) {
  const document = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const invoice = payment.invoice;
  const lines = [
    `Receipt Number: ${payment.receipt_number}`,
    `Invoice Reference: ${invoice?.invoice_number ?? "Unknown invoice"}`,
    `Customer: ${invoice?.customer_name ?? "Unknown customer"}`,
    `Payment Date: ${formatDate(payment.payment_date)}`,
    `Payment Method: ${payment.payment_method}`,
    `Amount Paid: ${formatCurrency(payment.amount_paid)}`,
    `Customer Contact: ${invoice?.customer_contact ?? "Not provided"}`,
    `Customer Address: ${invoice?.customer_address ?? "Not provided"}`,
    `Notes: ${payment.notes ?? "No notes provided."}`,
  ];

  document.setFont("helvetica", "bold");
  document.setFontSize(22);
  document.text("Payment Receipt", 48, 64);

  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.text("Recorded payment receipt", 48, 84);

  let currentY = 128;

  for (const line of lines) {
    const wrapped = document.splitTextToSize(line, 500);
    document.text(wrapped, 48, currentY);
    currentY += wrapped.length * 16 + 6;
  }

  document.setDrawColor(220, 220, 220);
  document.line(48, currentY + 12, 547, currentY + 12);
  document.setFont("helvetica", "italic");
  document.text("Generated from the payment record.", 48, currentY + 36);

  document.save(`${payment.receipt_number}.pdf`);
}
