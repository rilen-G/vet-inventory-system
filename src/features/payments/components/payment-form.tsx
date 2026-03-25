import { useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { DateInput } from "../../../components/ui/date-input";
import { NumberInput } from "../../../components/ui/number-input";
import { Select } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { useZodForm } from "../../../lib/forms";
import { formatCurrency, roundCurrency } from "../../../lib/utils";
import type { InvoiceDetail } from "../../invoices/types";
import { getInvoiceBalance, getInvoicePaidTotal } from "../../invoices/utils";
import { paymentFormSchema, type PaymentFormValues } from "../schemas";

type PaymentFormProps = {
  invoice: InvoiceDetail;
  onSubmit: (values: PaymentFormValues) => Promise<void> | void;
  isSubmitting: boolean;
};

function fieldError(message?: string) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-700">{message}</p>;
}

export function PaymentForm({ invoice, onSubmit, isSubmitting }: PaymentFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const balance = getInvoiceBalance(invoice);
  const paidTotal = getInvoicePaidTotal(invoice);
  const defaultAmount = roundCurrency(balance);
  const form = useZodForm(paymentFormSchema, {
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "Cash",
    amount_paid: defaultAmount,
    notes: "",
  });

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Record payment</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Payments can only be recorded for finalized invoices. Remaining balance must stay zero or above.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-3xl border border-[#c9ab67]/30 bg-[#fcfaf4] p-4 sm:grid-cols-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Invoice total</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(invoice.total)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Paid so far</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(paidTotal)}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Remaining balance</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(balance)}</div>
        </div>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);

          if (values.amount_paid > balance) {
            setSubmitError("Payment amount cannot be greater than the remaining balance.");
            return;
          }

          try {
            await onSubmit(values);
            form.reset({
              payment_date: new Date().toISOString().slice(0, 10),
              payment_method: "Cash",
              amount_paid: roundCurrency(Math.max(balance - values.amount_paid, 0)),
              notes: "",
            });
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Unable to record this payment.");
          }
        })}
      >
        {submitError ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{submitError}</div> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="payment_date">
              Payment date
            </label>
            <DateInput id="payment_date" {...form.register("payment_date")} aria-label="Open payment date calendar" />
            {fieldError(form.formState.errors.payment_date?.message)}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="payment_method">
              Payment method
            </label>
            <Select id="payment_method" {...form.register("payment_method")}>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
            </Select>
            {fieldError(form.formState.errors.payment_method?.message)}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="amount_paid">
              Amount paid
            </label>
            <NumberInput id="amount_paid" min="0.01" step="0.01" showStepper={false} {...form.register("amount_paid")} />
            {fieldError(form.formState.errors.amount_paid?.message)}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="payment_notes">
              Notes
            </label>
            <Textarea id="payment_notes" placeholder="Optional notes for this payment." {...form.register("notes")} />
            {fieldError(form.formState.errors.notes?.message)}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || balance <= 0}>
            {isSubmitting ? "Saving..." : "Record payment"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
