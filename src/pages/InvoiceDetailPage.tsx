import { useState } from "react";
import { useParams } from "react-router-dom";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Button } from "../components/ui/button";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { Modal } from "../components/ui/modal";
import { PageHeader } from "../components/ui/page-header";
import { Textarea } from "../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
} from "../components/ui/table";
import { isSupabaseConfigured } from "../lib/env";
import { useZodForm } from "../lib/forms";
import { formatCurrency, formatDate } from "../lib/utils";
import { InvoiceStatusBadge } from "../features/invoices/components/invoice-status-badge";
import { useCancelDraftInvoice, useFinalizeInvoice, useInvoiceDetail, useVoidInvoice } from "../features/invoices/hooks";
import { voidInvoiceSchema } from "../features/invoices/schemas";
import { getInvoiceBalance, getInvoicePaidTotal, getInvoicePaymentStatus } from "../features/invoices/utils";
import { useInventoryItems } from "../features/inventory/hooks";
import { PaymentStatusBadge } from "../features/payments/components/payment-status-badge";

type StockIssue = {
  inventoryItemId: number;
  label: string;
  requested: number;
  available: number;
};

export function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = id ? Number(id) : null;
  const isValidInvoiceId = invoiceId !== null && !Number.isNaN(invoiceId);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const invoiceQuery = useInvoiceDetail(isValidInvoiceId ? invoiceId : null);
  const inventoryItemsQuery = useInventoryItems(true);
  const cancelMutation = useCancelDraftInvoice(invoiceId ?? 0);
  const finalizeMutation = useFinalizeInvoice(invoiceId ?? 0);
  const voidMutation = useVoidInvoice(invoiceId ?? 0);
  const voidForm = useZodForm(voidInvoiceSchema, {
    void_reason: "",
  });

  function closeVoidModal() {
    setVoidOpen(false);
    voidForm.reset({ void_reason: "" });
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoice Detail"
          description="Connect Supabase first, then this page will show draft, finalized, cancelled, and voided invoice history."
          action={
            <ButtonLink to="/invoices" variant="secondary">
              Back to invoices
            </ButtonLink>
          }
        />
        <SupabaseRequired />
      </div>
    );
  }

  if (!isValidInvoiceId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoice Detail"
          description="The selected invoice could not be identified."
          action={
            <ButtonLink to="/invoices" variant="secondary">
              Back to invoices
            </ButtonLink>
          }
        />
        <Card>
          <p className="text-sm text-rose-700">The invoice ID in the URL is not valid.</p>
        </Card>
      </div>
    );
  }

  const invoice = invoiceQuery.data;
  const inventoryItems = inventoryItemsQuery.data ?? [];
  const inventoryMap = new Map(inventoryItems.map((item) => [item.id, item]));
  const paidTotal = invoice ? getInvoicePaidTotal(invoice) : 0;
  const balance = invoice ? getInvoiceBalance(invoice) : 0;
  const paymentStatus = invoice ? getInvoicePaymentStatus(invoice) : "Unpaid";
  const requestedByItem = new Map<number, StockIssue>();

  if (invoice) {
    for (const lineItem of invoice.invoice_items) {
      const existing = requestedByItem.get(lineItem.inventory_item_id);
      const currentInventoryItem = inventoryMap.get(lineItem.inventory_item_id);
      const nextRequested = (existing?.requested ?? 0) + lineItem.quantity;

      requestedByItem.set(lineItem.inventory_item_id, {
        inventoryItemId: lineItem.inventory_item_id,
        label: `${lineItem.item_name_snapshot} (${lineItem.lot_number_snapshot ?? "No lot"})`,
        requested: nextRequested,
        available: currentInventoryItem?.stock_quantity ?? 0,
      });
    }
  }

  const stockIssues = Array.from(requestedByItem.values()).filter((item) => item.available < item.requested);

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice ? `Invoice ${invoice.invoice_number}` : "Invoice Detail"}
        description="Review invoice details, line items, and status history. Finalize drafts, cancel drafts, and void finalized invoices from this page."
        action={
          <ButtonLink to="/invoices" variant="secondary">
            Back to invoices
          </ButtonLink>
        }
      />

      {invoiceQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading invoice...</p>
        </Card>
      ) : null}

      {invoiceQuery.isError ? (
        <Card>
          <p className="text-sm text-rose-700">{invoiceQuery.error.message}</p>
        </Card>
      ) : null}

      {invoice ? (
        <>
          <Card className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Invoice number</div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{invoice.invoice_number}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Created for <span className="font-semibold text-slate-900">{invoice.customer_name}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <InvoiceStatusBadge status={invoice.status} />
                {invoice.status === "Draft" ? (
                  <ButtonLink
                    className="h-9 w-9 rounded-full border-0 bg-transparent p-0"
                    to={`/invoices/${invoice.id}/edit`}
                    variant="ghost"
                    title="Edit"
                    aria-label="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </ButtonLink>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-sm text-slate-500">Invoice date</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{formatDate(invoice.invoice_date)}</div>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-sm text-slate-500">Due date</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{invoice.due_date ? formatDate(invoice.due_date) : "No due date"}</div>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-sm text-slate-500">Customer contact</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{invoice.customer_contact ?? "Not provided"}</div>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <div className="text-sm text-slate-500">Invoice total</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(invoice.total)}</div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-stone-200 p-4">
                <div className="text-sm font-semibold text-slate-900">Customer address</div>
                <div className="mt-2 text-sm leading-7 text-slate-600">{invoice.customer_address ?? "No address provided."}</div>
              </div>
              <div className="rounded-2xl border border-stone-200 p-4">
                <div className="text-sm font-semibold text-slate-900">Internal notes</div>
                <div className="mt-2 text-sm leading-7 text-slate-600">{invoice.notes ?? "No notes for this invoice."}</div>
              </div>
            </div>
          </Card>

          {actionError ? <Card className="bg-rose-50 text-sm text-rose-800">{actionError}</Card> : null}

          {invoice.status === "Voided" && invoice.void_reason ? (
            <Card className="bg-rose-50">
              <div className="text-sm font-semibold text-rose-900">VOID</div>
              <p className="mt-2 text-sm leading-7 text-rose-800">Reason: {invoice.void_reason}</p>
            </Card>
          ) : null}

          {invoice.status === "Cancelled" ? (
            <Card className="bg-stone-50">
              <p className="text-sm text-slate-700">This draft invoice was cancelled. It remains visible in history and did not affect stock.</p>
            </Card>
          ) : null}

          {invoice.status === "Draft" && stockIssues.length > 0 ? (
            <Card className="bg-amber-50">
              <div className="text-sm font-semibold text-amber-900">Stock validation warning</div>
              <p className="mt-2 text-sm leading-7 text-amber-800">
                This draft cannot be finalized until stock is sufficient for every line item.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {stockIssues.map((issue) => (
                  <li key={issue.inventoryItemId}>
                    {issue.label}: available {issue.available}, requested {issue.requested}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {invoice.status === "Draft" && stockIssues.length === 0 ? (
            <Card className="bg-brand-50">
              <p className="text-sm text-brand-900">Stock is sufficient for this draft. Finalizing will deduct stock immediately.</p>
            </Card>
          ) : null}

          {invoice.status === "Finalized" && invoice.payments.length > 0 ? (
            <Card className="bg-amber-50">
              <div className="text-sm font-semibold text-amber-900">Voiding is blocked</div>
              <p className="mt-2 text-sm leading-7 text-amber-800">
                This invoice already has recorded payments. Remove or reverse those payments first before voiding the invoice.
              </p>
            </Card>
          ) : null}

          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Invoice actions</h3>
                <p className="mt-1 text-sm text-slate-600">Actions available depend on the current invoice status.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {invoice.status === "Draft" ? (
                  <>
                    <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                      Cancel draft
                    </Button>
                    <Button onClick={() => setFinalizeOpen(true)} disabled={stockIssues.length > 0 || inventoryItemsQuery.isLoading}>
                      Finalize invoice
                    </Button>
                  </>
                ) : null}

                {invoice.status === "Finalized" ? (
                  <>
                    <ButtonLink to={`/payments?invoiceId=${invoice.id}`} variant="secondary">
                      {balance > 0 ? "Record payment" : "View payments"}
                    </ButtonLink>
                    <Button variant="danger" onClick={() => setVoidOpen(true)} disabled={invoice.payments.length > 0}>
                      Void invoice
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Payments</h3>
                <p className="mt-1 text-sm text-slate-600">Payment history and current balance for this invoice.</p>
              </div>
              <PaymentStatusBadge status={paymentStatus} />
            </div>

            <div className="mt-5 grid gap-4 rounded-3xl bg-stone-50 p-4 sm:grid-cols-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Paid so far</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(paidTotal)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Remaining balance</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(balance)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Payment status</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{paymentStatus}</div>
              </div>
            </div>

            {invoice.status === "Draft" ? (
              <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-slate-600">
                Draft invoices cannot receive payments yet. Finalize the invoice first.
              </div>
            ) : null}

            {invoice.payments.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-slate-600">
                No payments recorded for this invoice yet.
              </div>
            ) : null}

            {invoice.payments.length > 0 ? (
              <div className="mt-5 space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{payment.receipt_number}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {payment.payment_method} • {formatDate(payment.payment_date)} • {formatCurrency(payment.amount_paid)}
                        </div>
                        {payment.notes ? <div className="mt-2 text-sm text-slate-500">{payment.notes}</div> : null}
                      </div>
                      <ButtonLink to={`/receipts/${payment.id}`} variant="secondary">
                        View receipt
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Line items</h3>
            <p className="mt-1 text-sm text-slate-600">Snapshot fields preserve the item name, lot, and unit price used when the invoice was saved.</p>

            <div className="mt-6">
              <TableContainer>
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeaderCell>Item</TableHeaderCell>
                      <TableHeaderCell>Lot Number</TableHeaderCell>
                      <TableHeaderCell>Qty</TableHeaderCell>
                      <TableHeaderCell>Unit Price</TableHeaderCell>
                      <TableHeaderCell>Line Total</TableHeaderCell>
                      <TableHeaderCell>Current Stock</TableHeaderCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {invoice.invoice_items.map((item) => {
                      const currentInventoryItem = inventoryMap.get(item.inventory_item_id);

                      return (
                        <tr key={item.id}>
                          <TableCell className="font-medium text-slate-900">{item.item_name_snapshot}</TableCell>
                          <TableCell>{item.lot_number_snapshot ?? "No lot"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell>{formatCurrency(item.line_total)}</TableCell>
                          <TableCell>{currentInventoryItem ? currentInventoryItem.stock_quantity : "Item not found"}</TableCell>
                        </tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </Card>

          <ConfirmDialog
            open={cancelOpen}
            onClose={() => setCancelOpen(false)}
            onConfirm={async () => {
              setActionError(null);

              try {
                await cancelMutation.mutateAsync();
                setCancelOpen(false);
              } catch (error) {
                setActionError(error instanceof Error ? error.message : "Unable to cancel this draft invoice.");
              }
            }}
            title="Cancel draft invoice"
            description="Cancelled applies only to draft invoices. This action will keep the invoice in history without affecting stock."
            confirmLabel="Yes, cancel draft"
            isConfirming={cancelMutation.isPending}
          />

          <ConfirmDialog
            open={finalizeOpen}
            onClose={() => setFinalizeOpen(false)}
            onConfirm={async () => {
              setActionError(null);

              try {
                await finalizeMutation.mutateAsync();
                setFinalizeOpen(false);
              } catch (error) {
                setActionError(error instanceof Error ? error.message : "Unable to finalize this invoice.");
              }
            }}
            title="Finalize invoice"
            description="Finalizing will deduct stock immediately and make this invoice official."
            confirmLabel="Finalize invoice"
            isConfirming={finalizeMutation.isPending}
          >
            <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-slate-700">
              Stock will be deducted based on the current line item quantities in this draft.
            </div>
          </ConfirmDialog>

          <Modal
            open={voidOpen}
            onClose={closeVoidModal}
            title="Void finalized invoice"
            description="Voiding restores stock and keeps the invoice visible in history. A reason is required."
            footer={
              <>
                <Button variant="secondary" onClick={closeVoidModal} disabled={voidMutation.isPending}>
                  Back
                </Button>
                <Button variant="danger" type="submit" form="void-invoice-form" disabled={voidMutation.isPending}>
                  {voidMutation.isPending ? "Voiding..." : "Void invoice"}
                </Button>
              </>
            }
          >
            <form
              id="void-invoice-form"
              className="space-y-4"
              onSubmit={voidForm.handleSubmit(async (values) => {
                setActionError(null);

                try {
                  await voidMutation.mutateAsync(values.void_reason);
                  closeVoidModal();
                } catch (error) {
                  setActionError(error instanceof Error ? error.message : "Unable to void this invoice.");
                }
              })}
            >
              {voidForm.formState.errors.void_reason ? (
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Please enter a void reason before voiding this invoice.
                </div>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-slate-700" htmlFor="void_reason">
                  Void reason
                </label>
                <Textarea
                  id="void_reason"
                  placeholder="Explain why this invoice is being voided."
                  {...voidForm.register("void_reason")}
                />
                {voidForm.formState.errors.void_reason ? (
                  <p className="mt-2 text-sm text-rose-700">{voidForm.formState.errors.void_reason.message}</p>
                ) : null}
              </div>

              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
                Stock for every line item will be restored through stock movement entries.
              </div>
            </form>
          </Modal>
        </>
      ) : null}
    </div>
  );
}
