import { useState } from "react";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Button } from "../components/ui/button";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { Input } from "../components/ui/input";
import { PageHeader } from "../components/ui/page-header";
import { StatCard } from "../components/ui/stat-card";
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
import { InvoiceStatusBadge } from "../features/invoices/components/invoice-status-badge";
import { PaymentStatusBadge } from "../features/payments/components/payment-status-badge";
import { useInvoices } from "../features/invoices/hooks";
import type { InvoiceStatusFilter } from "../features/invoices/types";
import { getInvoiceBalance, getInvoicePaymentStatus } from "../features/invoices/utils";

const statusFilters: InvoiceStatusFilter[] = ["all", "Draft", "Finalized", "Voided", "Cancelled"];

export function InvoiceListPage() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const invoicesQuery = useInvoices();

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Sales Invoices"
          description="Connect Supabase first, then this page will show draft, finalized, cancelled, and voided invoices."
          action={<ButtonLink to="/invoices/new">Create invoice</ButtonLink>}
        />
        <SupabaseRequired />
      </div>
    );
  }

  const invoices = invoicesQuery.data ?? [];
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      invoice.invoice_number.toLowerCase().includes(normalizedSearch) ||
      invoice.customer_name.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const draftCount = invoices.filter((invoice) => invoice.status === "Draft").length;
  const finalizedCount = invoices.filter((invoice) => invoice.status === "Finalized").length;
  const voidedCount = invoices.filter((invoice) => invoice.status === "Voided").length;
  const cancelledCount = invoices.filter((invoice) => invoice.status === "Cancelled").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices"
        description="Create draft invoices, review invoice history, and track which records are finalized, cancelled, or voided."
        action={<ButtonLink to="/invoices/new">Create invoice</ButtonLink>}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Draft Invoices" value={String(draftCount)} detail="Editable invoices waiting for final review." />
        <StatCard label="Finalized Invoices" value={String(finalizedCount)} detail="Official invoices that already deducted stock." />
        <StatCard label="Voided Invoices" value={String(voidedCount)} detail="Finalized invoices reversed back into stock." />
        <StatCard label="Cancelled Drafts" value={String(cancelledCount)} detail="Draft invoices kept in history without stock effect." />
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_auto]">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by invoice number or customer name"
          />
          <Button
            variant="secondary"
            onClick={() => {
              setSearchValue("");
              setStatusFilter("all");
            }}
          >
            Reset
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "secondary" : "ghost"}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All invoices" : status}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Invoice history</h3>
            <p className="mt-1 text-sm text-slate-600">Voided invoices remain visible here for traceability.</p>
          </div>
          <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700">
            Showing {filteredInvoices.length} of {invoices.length}
          </div>
        </div>

        {invoicesQuery.isLoading ? <p className="mt-6 text-sm text-slate-500">Loading invoices...</p> : null}
        {invoicesQuery.isError ? <p className="mt-6 text-sm text-rose-700">{invoicesQuery.error.message}</p> : null}

        {!invoicesQuery.isLoading && !invoicesQuery.isError && invoices.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No invoices yet"
              description="Create the first invoice draft to start the sales workflow."
              action={<ButtonLink to="/invoices/new">Create first invoice</ButtonLink>}
            />
          </div>
        ) : null}

        {!invoicesQuery.isLoading && !invoicesQuery.isError && invoices.length > 0 && filteredInvoices.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No matching invoices"
              description="Try a different search term or status filter."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchValue("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : null}

        {!invoicesQuery.isLoading && !invoicesQuery.isError && filteredInvoices.length > 0 ? (
          <div className="mt-6">
            <TableContainer>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Invoice No.</TableHeaderCell>
                    <TableHeaderCell>Customer</TableHeaderCell>
                    <TableHeaderCell>Invoice Date</TableHeaderCell>
                    <TableHeaderCell>Due Date</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Payment Status</TableHeaderCell>
                    <TableHeaderCell>Balance</TableHeaderCell>
                    <TableHeaderCell>Items</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <TableCell className="font-medium text-slate-900">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>{invoice.customer_name}</div>
                        {invoice.customer_contact ? <div className="mt-1 text-xs text-slate-500">{invoice.customer_contact}</div> : null}
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>{invoice.due_date ? formatDate(invoice.due_date) : "No due date"}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={getInvoicePaymentStatus(invoice)} />
                      </TableCell>
                      <TableCell>{formatCurrency(getInvoiceBalance(invoice))}</TableCell>
                      <TableCell>{invoice.invoice_items.length}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <ButtonLink className="px-3 py-2 text-xs" variant="secondary" to={`/invoices/${invoice.id}`}>
                            View
                          </ButtonLink>
                          {invoice.status === "Draft" ? (
                            <ButtonLink className="px-3 py-2 text-xs" variant="ghost" to={`/invoices/${invoice.id}/edit`}>
                              Edit draft
                            </ButtonLink>
                          ) : null}
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
