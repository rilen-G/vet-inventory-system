import { useEffect, useState } from "react";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Button } from "../components/ui/button";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { Input } from "../components/ui/input";
import { PageHeader } from "../components/ui/page-header";
import { Pagination } from "../components/ui/pagination";
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
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesQuery = useInvoices();
  const pageSize = 10;

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
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const emptyRows = filteredInvoices.length >= pageSize ? pageSize - paginatedInvoices.length : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchValue]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

      <Card>
        <div className="flex flex-col gap-4">
          {/*<div>*/}
          {/*  <h3 className="text-lg font-semibold text-slate-900">Invoice history</h3>*/}
          {/*  <p className="mt-1 text-sm text-slate-600">Voided invoices remain visible here for traceability.</p>*/}
          {/*</div>*/}

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
                  {paginatedInvoices.map((invoice) => (
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
                          <ButtonLink
                            className="h-9 w-9 rounded-full border border-[#c9ab67]/40 bg-[#fcfaf4] p-0 text-[#b89443] hover:border-[#b89443] hover:bg-[#f8f2e3] hover:text-[#8f6a1d] focus:ring-[#e5d19d]"
                            variant="ghost"
                            to={`/invoices/${invoice.id}`}
                            title="View"
                            aria-label="View"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                          </ButtonLink>
                          {invoice.status === "Draft" ? (
                            <ButtonLink
                              className="h-9 w-9 rounded-full border border-[#c9ab67]/40 bg-[#fcfaf4] p-0 text-[#b89443] hover:border-[#b89443] hover:bg-[#f8f2e3] hover:text-[#8f6a1d] focus:ring-[#e5d19d]"
                              variant="ghost"
                              to={`/invoices/${invoice.id}/edit`}
                              title="Edit"
                              aria-label="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </ButtonLink>
                          ) : null}
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRows }).map((_, index) => (
                    <tr key={`invoice-empty-${index}`} aria-hidden="true">
                      <TableCell colSpan={10} className="h-[73px] bg-white" />
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredInvoices.length}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
