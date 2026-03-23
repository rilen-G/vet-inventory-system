import { useNavigate, useSearchParams } from "react-router-dom";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { PageHeader } from "../components/ui/page-header";
import { StatCard } from "../components/ui/stat-card";
import { isSupabaseConfigured } from "../lib/env";
import { formatCurrency, formatDate } from "../lib/utils";
import { getInvoiceBalance, getInvoicePaidTotal, getInvoicePaymentStatus } from "../features/invoices/utils";
import { useInvoices } from "../features/invoices/hooks";
import { PaymentForm } from "../features/payments/components/payment-form";
import { PaymentStatusBadge } from "../features/payments/components/payment-status-badge";
import { usePayments, useRecordPayment } from "../features/payments/hooks";

export function PaymentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const invoicesQuery = useInvoices();
  const paymentsQuery = usePayments();

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payments"
          description="Connect Supabase first, then this page will record payments against finalized invoices and show receipt history."
        />
        <SupabaseRequired />
      </div>
    );
  }

  const finalizedInvoices = (invoicesQuery.data ?? []).filter((invoice) => invoice.status === "Finalized");
  const requestedInvoiceId = Number(searchParams.get("invoiceId"));
  const selectedInvoice =
    finalizedInvoices.find((invoice) => invoice.id === requestedInvoiceId) ?? finalizedInvoices[0] ?? null;
  const recordPaymentMutation = useRecordPayment(selectedInvoice?.id ?? 0);
  const totalPayments = (paymentsQuery.data ?? []).reduce((sum, payment) => sum + payment.amount_paid, 0);
  const unpaidFinalizedCount = finalizedInvoices.filter((invoice) => getInvoicePaymentStatus(invoice) === "Unpaid").length;
  const partiallyPaidCount = finalizedInvoices.filter((invoice) => getInvoicePaymentStatus(invoice) === "Partially Paid").length;
  const paidCount = finalizedInvoices.filter((invoice) => getInvoicePaymentStatus(invoice) === "Paid").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Record payments only for finalized invoices, monitor balances, and move directly into receipt generation."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Finalized Invoices" value={String(finalizedInvoices.length)} detail="Invoices eligible for payment recording." />
        <StatCard label="Unpaid Finalized" value={String(unpaidFinalizedCount)} detail="Finalized invoices with no payments yet." />
        <StatCard label="Partially Paid" value={String(partiallyPaidCount)} detail="Finalized invoices with an outstanding balance." />
        <StatCard label="Total Collected" value={formatCurrency(totalPayments)} detail={`Paid invoices: ${paidCount}`} />
      </div>

      {invoicesQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading invoices...</p>
        </Card>
      ) : null}

      {invoicesQuery.isError ? (
        <Card>
          <p className="text-sm text-rose-700">{invoicesQuery.error.message}</p>
        </Card>
      ) : null}

      {!invoicesQuery.isLoading && !invoicesQuery.isError && finalizedInvoices.length === 0 ? (
        <EmptyState
          title="No finalized invoices yet"
          description="Finalize an invoice first before recording payments."
          action={<ButtonLink to="/invoices">Go to invoices</ButtonLink>}
        />
      ) : null}

      {selectedInvoice ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Finalized invoices</h3>
              <p className="mt-1 text-sm text-slate-600">Choose which finalized invoice will receive a payment.</p>
            </div>

            <div className="space-y-3">
              {finalizedInvoices.map((invoice) => {
                const isSelected = selectedInvoice.id === invoice.id;

                return (
                  <button
                    key={invoice.id}
                    type="button"
                    onClick={() => setSearchParams({ invoiceId: String(invoice.id) })}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      isSelected ? "border-stone-400 bg-stone-50" : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{invoice.invoice_number}</div>
                        <div className="mt-1 text-sm text-slate-600">{invoice.customer_name}</div>
                        <div className="mt-2 text-sm text-slate-500">
                          Balance: {formatCurrency(getInvoiceBalance(invoice))} • {formatDate(invoice.invoice_date)}
                        </div>
                      </div>
                      <PaymentStatusBadge status={getInvoicePaymentStatus(invoice)} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedInvoice.invoice_number}</h3>
                  <p className="mt-1 text-sm text-slate-600">{selectedInvoice.customer_name}</p>
                </div>
                <ButtonLink to={`/invoices/${selectedInvoice.id}`} variant="secondary">
                  View invoice
                </ButtonLink>
              </div>

              <div className="grid gap-4 rounded-3xl bg-stone-50 p-4 sm:grid-cols-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Invoice total</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(selectedInvoice.total)}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Paid so far</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(getInvoicePaidTotal(selectedInvoice))}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Remaining balance</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(getInvoiceBalance(selectedInvoice))}</div>
                </div>
              </div>
            </Card>

            <PaymentForm
              invoice={selectedInvoice}
              isSubmitting={recordPaymentMutation.isPending}
              onSubmit={async (values) => {
                const payment = await recordPaymentMutation.mutateAsync(values);
                navigate(`/receipts/${payment.id}`);
              }}
            />

            <Card>
              <h3 className="text-lg font-semibold text-slate-900">Payment history for this invoice</h3>
              <p className="mt-1 text-sm text-slate-600">Receipts remain tied to the finalized invoice they belong to.</p>

              {selectedInvoice.payments.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-slate-600">No payments recorded yet.</div>
              ) : (
                <div className="mt-5 space-y-3">
                  {selectedInvoice.payments.map((payment) => (
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
              )}
            </Card>
          </div>
        </div>
      ) : null}

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Recent recorded payments</h3>
        <p className="mt-1 text-sm text-slate-600">Latest payment activity across all invoices.</p>

        {paymentsQuery.isLoading ? <p className="mt-5 text-sm text-slate-500">Loading payment history...</p> : null}
        {paymentsQuery.isError ? <p className="mt-5 text-sm text-rose-700">{paymentsQuery.error.message}</p> : null}

        {!paymentsQuery.isLoading && !paymentsQuery.isError && (paymentsQuery.data?.length ?? 0) === 0 ? (
          <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-slate-600">No payments have been recorded yet.</div>
        ) : null}

        {!paymentsQuery.isLoading && !paymentsQuery.isError && (paymentsQuery.data?.length ?? 0) > 0 ? (
          <div className="mt-5 space-y-3">
            {paymentsQuery.data?.slice(0, 6).map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{payment.receipt_number}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {payment.invoice?.invoice_number ?? "Unknown invoice"} • {payment.invoice?.customer_name ?? "Unknown customer"}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {payment.payment_method} • {formatDate(payment.payment_date)} • {formatCurrency(payment.amount_paid)}
                    </div>
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
    </div>
  );
}
