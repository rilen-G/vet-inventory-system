import { useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { DateInput } from "../../../components/ui/date-input";
import { Input } from "../../../components/ui/input";
import { NumberInput } from "../../../components/ui/number-input";
import { Select } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { useZodForm } from "../../../lib/forms";
import { formatCurrency } from "../../../lib/utils";
import type { InventoryItem } from "../../inventory/types";
import { getInventoryStatus } from "../../inventory/utils";
import { invoiceFormSchema, type InvoiceFormValues } from "../schemas";
import { calculateInvoiceTotals } from "../utils";

type InvoiceFormProps = {
  mode: "create" | "edit";
  inventoryItems: InventoryItem[];
  initialValues?: InvoiceFormValues;
  onSubmit: (values: InvoiceFormValues) => Promise<void> | void;
  submitLabel: string;
  isSubmitting: boolean;
  invoiceNumber?: string;
};

function fieldError(message?: string) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-700">{message}</p>;
}

export function InvoiceForm({
  mode,
  inventoryItems,
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  invoiceNumber,
}: InvoiceFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useZodForm(invoiceFormSchema, {
    customer_name: "",
    customer_address: "",
    customer_contact: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    notes: "",
    line_items: [{ inventory_item_id: 0, quantity: 1, unit_price: 0 }],
  });
  const lineItemsArray = useFieldArray({
    control: form.control,
    name: "line_items",
  });

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    form.reset(initialValues);
  }, [form, initialValues]);

  const watchedLineItems = form.watch("line_items");
  const totals = calculateInvoiceTotals(watchedLineItems);

  return (
    <Card>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setSubmitError(null);

          try {
            await onSubmit(values);
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Unable to save this invoice.");
          }
        })}
      >
        {submitError ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{submitError}</div> : null}

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="customer_name">
                Customer name
              </label>
              <Input id="customer_name" placeholder="Clinic or customer name" {...form.register("customer_name")} />
              {fieldError(form.formState.errors.customer_name?.message)}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="customer_contact">
                Contact number
              </label>
              <Input id="customer_contact" placeholder="Phone or mobile number" {...form.register("customer_contact")} />
              {fieldError(form.formState.errors.customer_contact?.message)}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="customer_address">
                Address
              </label>
              <Input id="customer_address" placeholder="Customer address" {...form.register("customer_address")} />
              {fieldError(form.formState.errors.customer_address?.message)}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="invoice_date">
                Invoice date
              </label>
              <DateInput id="invoice_date" {...form.register("invoice_date")} aria-label="Open invoice date calendar" />
              {fieldError(form.formState.errors.invoice_date?.message)}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="due_date">
                Due date
              </label>
              <DateInput id="due_date" {...form.register("due_date")} aria-label="Open due date calendar" />
              {fieldError(form.formState.errors.due_date?.message)}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="invoice_notes">
                Notes
              </label>
              <Textarea id="invoice_notes" placeholder="Optional notes for this invoice." {...form.register("notes")} />
              {fieldError(form.formState.errors.notes?.message)}
            </div>
          </div>

          <div className="rounded-3xl bg-stone-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Invoice summary</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm text-slate-500">Invoice number</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{invoiceNumber ?? "Generated on save"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Mode</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{mode === "create" ? "Create draft" : "Edit draft"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Line items</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{watchedLineItems.length}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Invoice total</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totals.total)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Invoice items</h3>
              {/*<p className="mt-1 text-sm text-slate-600">*/}
              {/*  Select inventory lots, then set quantity. Unit price comes from inventory. Drafts can exceed stock, but finalization will be blocked until stock is sufficient.*/}
              {/*</p>*/}
            </div>
            <Button
              variant="secondary"
              onClick={() => lineItemsArray.append({ inventory_item_id: 0, quantity: 1, unit_price: 0 })}
            >
              Add line item
            </Button>
          </div>

          {typeof form.formState.errors.line_items?.message === "string" ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{form.formState.errors.line_items.message}</div>
          ) : null}

          <div className="space-y-4">
            {lineItemsArray.fields.map((field, index) => {
              const lineItem = watchedLineItems[index];
              const selectedItem = inventoryItems.find((item) => item.id === Number(lineItem?.inventory_item_id));
              const quantity = Number(lineItem?.quantity ?? 0);
              const unitPrice = Number(lineItem?.unit_price ?? 0);
              const exceedsStock = selectedItem ? quantity > selectedItem.stock_quantity : false;
              const selectRegistration = form.register(`line_items.${index}.inventory_item_id`);

              return (
                <div key={field.id} className="rounded-3xl border border-stone-200 p-4">
                  <div className="grid gap-4 xl:grid-cols-[1.5fr_0.8fr_0.8fr_auto]">
                    <div>
                      <label className="text-sm font-semibold text-slate-700">Inventory item lot</label>
                      <Select
                        {...selectRegistration}
                        onChange={(event) => {
                          selectRegistration.onChange(event);
                          const selectedInventoryId = Number(event.target.value);
                          const matchedItem = inventoryItems.find((item) => item.id === selectedInventoryId);

                          if (matchedItem) {
                            form.setValue(`line_items.${index}.unit_price`, matchedItem.unit_price, { shouldValidate: true });
                          }
                        }}
                      >
                        <option value="0">Select an inventory lot</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item_name} • {item.lot_number} • Stock {item.stock_quantity}
                          </option>
                        ))}
                      </Select>
                      {fieldError(form.formState.errors.line_items?.[index]?.inventory_item_id?.message)}
                      {selectedItem ? (
                        <p className="mt-2 text-sm text-slate-500">
                          {selectedItem.company_category ?? "No category"} • {selectedItem.lot_number} • Current stock {selectedItem.stock_quantity} •{" "}
                          {getInventoryStatus(selectedItem)}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">Quantity</label>
                      <NumberInput min="1" step="1" {...form.register(`line_items.${index}.quantity`)} />
                      {fieldError(form.formState.errors.line_items?.[index]?.quantity?.message)}
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700">Unit price</label>
                      <NumberInput
                        min="0"
                        step="1"
                        showStepper={false}
                        readOnly
                        className="bg-stone-50 text-slate-500"
                        {...form.register(`line_items.${index}.unit_price`)}
                      />
                      {fieldError(form.formState.errors.line_items?.[index]?.unit_price?.message)}
                    </div>

                    <div className="flex items-center pt-5">
                      <Button
                        variant="ghost"
                        className="w-full px-0"
                        onClick={() => {
                          if (lineItemsArray.fields.length > 1) {
                            lineItemsArray.remove(index);
                          }
                        }}
                        disabled={lineItemsArray.fields.length === 1}
                        aria-label="Remove line item"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-7"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-stone-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-600">
                      Line total: <span className="font-semibold text-slate-900">{formatCurrency(quantity * unitPrice)}</span>
                    </div>
                    {exceedsStock ? (
                      <div className="text-sm font-medium text-amber-800">
                        Requested quantity is above current stock. Draft can still be saved, but finalization will be blocked.
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-stone-50 px-5 py-4">
          <div>
            <div className="text-sm text-slate-500">Subtotal</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totals.subtotal)}</div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
