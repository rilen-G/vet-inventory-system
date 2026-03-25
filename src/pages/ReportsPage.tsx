import { useEffect, useState, type ReactNode } from "react";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/ui/page-header";
import { Pagination } from "../components/ui/pagination";
import { InventoryStatusBadge } from "../features/inventory/components/inventory-status-badge";
import { InvoiceStatusBadge } from "../features/invoices/components/invoice-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
} from "../components/ui/table";
import { isSupabaseConfigured } from "../lib/env";
import { formatCurrency, formatDate } from "../lib/utils";
import { useInvoices } from "../features/invoices/hooks";
import { getInvoiceBalance, getInvoicePaymentStatus } from "../features/invoices/utils";
import { useInventoryItems } from "../features/inventory/hooks";
import { isExpired, isLowStock, isNearExpiry } from "../features/inventory/utils";
import { PaymentStatusBadge } from "../features/payments/components/payment-status-badge";
import { usePayments } from "../features/payments/hooks";
import { exportReportsWorkbook } from "../features/reports/export";

type ReportSectionProps = {
  title: string;
  description: string;
  headers: string[];
  rows: ReactNode[][];
};

function ReportSection({ title, description, headers, rows }: ReportSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const emptyRows = rows.length >= pageSize ? pageSize - paginatedRows.length : 0;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <Card>
      <div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-slate-600">No records in this section.</div>
      ) : (
        <div className="mt-5">
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  {headers.map((header) => (
                    <TableHeaderCell key={header}>{header}</TableHeaderCell>
                  ))}
                </tr>
              </TableHead>
              <TableBody>
                {paginatedRows.map((row, index) => (
                  <tr key={`${title}-${index}`}>
                    {row.map((value, columnIndex) => (
                      <TableCell key={`${title}-${index}-${columnIndex}`}>{value}</TableCell>
                    ))}
                  </tr>
                ))}
                {Array.from({ length: emptyRows }).map((_, index) => (
                  <tr key={`${title}-empty-${index}`} aria-hidden="true">
                    <TableCell colSpan={headers.length} className="h-[73px] bg-white" />
                  </tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={rows.length}
            onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          />
        </div>
      )}
    </Card>
  );
}

export function ReportsPage() {
  const inventoryQuery = useInventoryItems(false);
  const invoicesQuery = useInvoices();
  const paymentsQuery = usePayments();

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Connect Supabase first, then this page will show live operational reports and Excel export."
        />
        <SupabaseRequired />
      </div>
    );
  }

  const inventoryItems = inventoryQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const lowStockItems = inventoryItems.filter((item) => isLowStock(item));
  const expiryItems = inventoryItems.filter((item) => isNearExpiry(item.expiration_date) || isExpired(item.expiration_date));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational report sections for inventory, expiry, invoices, and payment history."
        action={
          <Button
            onClick={() =>
              exportReportsWorkbook({
                inventoryItems,
                invoices,
                payments,
              })
            }
          >
            Download Excel report
          </Button>
        }
      />

      {(inventoryQuery.isLoading || invoicesQuery.isLoading || paymentsQuery.isLoading) && (
        <Card>
          <p className="text-sm text-slate-500">Loading report data...</p>
        </Card>
      )}

      {(inventoryQuery.isError || invoicesQuery.isError || paymentsQuery.isError) && (
        <Card>
          <p className="text-sm text-rose-700">
            {inventoryQuery.error?.message || invoicesQuery.error?.message || paymentsQuery.error?.message}
          </p>
        </Card>
      )}

      <ReportSection
        title="Inventory report"
        description="Current inventory lots with stock, expiry, and pricing details."
        headers={["Item", "Category", "Lot", "Expiry", "Stock", "Status"]}
        rows={inventoryItems.map((item) => [
          item.item_name,
          item.company_category ?? "Uncategorized",
          item.lot_number,
          formatDate(item.expiration_date),
          String(item.stock_quantity),
          <InventoryStatusBadge key={`inventory-status-${item.id}`} item={item} />,
        ])}
      />

      <ReportSection
        title="Low stock report"
        description="Inventory lots at or below their configured threshold."
        headers={["Item", "Lot", "Stock", "Threshold", "Category"]}
        rows={lowStockItems.map((item) => [
          item.item_name,
          item.lot_number,
          String(item.stock_quantity),
          String(item.low_stock_threshold),
          item.company_category ?? "Uncategorized",
        ])}
      />

      <ReportSection
        title="Expiry report"
        description="Inventory lots that are near expiry or already expired."
        headers={["Item", "Lot", "Expiry Date", "Status", "Stock"]}
        rows={expiryItems.map((item) => [
          item.item_name,
          item.lot_number,
          formatDate(item.expiration_date),
          <InventoryStatusBadge key={`expiry-status-${item.id}`} item={item} />,
          String(item.stock_quantity),
        ])}
      />

      <ReportSection
        title="Invoice status report"
        description="Invoice lifecycle and payment summary across the current dataset."
        headers={["Invoice", "Customer", "Status", "Payment Status", "Total", "Balance"]}
        rows={invoices.map((invoice) => [
          invoice.invoice_number,
          invoice.customer_name,
          <InvoiceStatusBadge key={`invoice-status-${invoice.id}`} status={invoice.status} />,
          <PaymentStatusBadge key={`invoice-payment-status-${invoice.id}`} status={getInvoicePaymentStatus(invoice)} />,
          formatCurrency(invoice.total),
          formatCurrency(getInvoiceBalance(invoice)),
        ])}
      />

      <ReportSection
        title="Payment history report"
        description="Recorded payments and their linked invoice references."
        headers={["Receipt", "Invoice", "Customer", "Date", "Method", "Amount"]}
        rows={payments.map((payment) => [
          payment.receipt_number,
          payment.invoice?.invoice_number ?? "Unknown",
          payment.invoice?.customer_name ?? "Unknown",
          formatDate(payment.payment_date),
          payment.payment_method,
          formatCurrency(payment.amount_paid),
        ])}
      />
    </div>
  );
}
