import { useParams } from "react-router-dom";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Button } from "../components/ui/button";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/ui/page-header";
import { isSupabaseConfigured } from "../lib/env";
import { formatCurrency, formatDate } from "../lib/utils";
import { usePaymentDetail } from "../features/payments/hooks";
import { downloadReceiptPdf } from "../features/payments/receipt-pdf";

export function ReceiptPage() {
  const { paymentId } = useParams();
  const numericPaymentId = paymentId ? Number(paymentId) : null;
  const isValidPaymentId = numericPaymentId !== null && !Number.isNaN(numericPaymentId);
  const paymentQuery = usePaymentDetail(isValidPaymentId ? numericPaymentId : null);

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Receipt${paymentId ? ` #${paymentId}` : ""}`}
          description="Connect Supabase first, then this page will show printable receipt details."
          action={
            <ButtonLink to="/payments" variant="secondary">
              Back to payments
            </ButtonLink>
          }
        />
        <SupabaseRequired />
      </div>
    );
  }

  if (!isValidPaymentId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Receipt"
          description="The selected payment could not be identified."
          action={
            <ButtonLink to="/payments" variant="secondary">
              Back to payments
            </ButtonLink>
          }
        />
        <Card>
          <p className="text-sm text-rose-700">The payment ID in the URL is not valid.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={paymentQuery.data ? `Receipt ${paymentQuery.data.receipt_number}` : `Receipt${paymentId ? ` #${paymentId}` : ""}`}
        description="Printable receipt view for a recorded payment tied to a finalized invoice."
        action={
          <ButtonLink to="/payments" variant="secondary">
            Back to payments
          </ButtonLink>
        }
      />

      {paymentQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading receipt...</p>
        </Card>
      ) : null}

      {paymentQuery.isError ? (
        <Card>
          <p className="text-sm text-rose-700">{paymentQuery.error.message}</p>
        </Card>
      ) : null}

      {paymentQuery.data ? (
        <>
          <div className="flex flex-wrap gap-3 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              Print receipt
            </Button>
            <Button onClick={() => downloadReceiptPdf(paymentQuery.data)}>Download PDF</Button>
          </div>

          <Card className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-[#c9ab67]/35 bg-[#fcfaf4] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Receipt</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{paymentQuery.data.receipt_number}</h2>
                  <p className="mt-2 text-sm text-slate-600">Payment Receipt for the finalized sales invoice.</p>
                </div>
                <div className="text-sm text-slate-600">
                  <div>Date: {formatDate(paymentQuery.data.payment_date)}</div>
                  <div className="mt-1">Method: {paymentQuery.data.payment_method}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-[#c9ab67]/35 p-5">
                <div className="text-sm font-semibold text-slate-900">Customer</div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div>{paymentQuery.data.invoice?.customer_name ?? "Unknown customer"}</div>
                  <div>{paymentQuery.data.invoice?.customer_contact ?? "No contact provided"}</div>
                  <div>{paymentQuery.data.invoice?.customer_address ?? "No address provided"}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#c9ab67]/35 p-5">
                <div className="text-sm font-semibold text-slate-900">Invoice Reference</div>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <div>Invoice No.: {paymentQuery.data.invoice?.invoice_number ?? "Unknown invoice"}</div>
                  <div>Invoice Date: {paymentQuery.data.invoice?.invoice_date ? formatDate(paymentQuery.data.invoice.invoice_date) : "Unknown"}</div>
                  <div>Amount Paid: {formatCurrency(paymentQuery.data.amount_paid)}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#c9ab67]/30 bg-[#fcfaf4] p-5">
              <div className="text-sm font-semibold text-slate-900">Notes</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{paymentQuery.data.notes ?? "No notes provided for this payment."}</p>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
