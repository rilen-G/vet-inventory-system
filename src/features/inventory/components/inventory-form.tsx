import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useZodForm } from "../../../lib/forms";
import type { InventoryItem } from "../types";
import { inventoryItemFormSchema, type InventoryItemFormValues } from "../schemas";

type InventoryFormProps = {
  mode: "create" | "edit";
  initialItem?: InventoryItem;
  onSubmit: (values: InventoryItemFormValues) => Promise<void> | void;
  submitLabel: string;
  isSubmitting: boolean;
};

function fieldError(message?: string) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-700">{message}</p>;
}

export function InventoryForm({ mode, initialItem, onSubmit, submitLabel, isSubmitting }: InventoryFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useZodForm(inventoryItemFormSchema, {
    item_name: "",
    company_category: "",
    lot_number: "",
    expiration_date: "",
    stock_quantity: 0,
    low_stock_threshold: 5,
    unit_price: 0,
    notes: "",
  });

  useEffect(() => {
    if (!initialItem) {
      return;
    }

    form.reset({
      item_name: initialItem.item_name,
      company_category: initialItem.company_category ?? "",
      lot_number: initialItem.lot_number,
      expiration_date: initialItem.expiration_date,
      stock_quantity: initialItem.stock_quantity,
      low_stock_threshold: initialItem.low_stock_threshold,
      unit_price: initialItem.unit_price,
      notes: initialItem.notes ?? "",
    });
  }, [form, initialItem]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Card>
      <form
        className="space-y-6"
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null);

          try {
            await onSubmit(values);
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Unable to save inventory item.");
          }
        })}
      >
        {submitError ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{submitError}</div> : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="item_name">
              Item name
            </label>
            <Input id="item_name" placeholder="e.g. Canine Vaccine A" {...register("item_name")} />
            {fieldError(errors.item_name?.message)}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="company_category">
              Company / category
            </label>
            <Input id="company_category" placeholder="e.g. Vaccines" {...register("company_category")} />
            {fieldError(errors.company_category?.message)}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="lot_number">
              Lot number
            </label>
            <Input id="lot_number" placeholder="e.g. CVA-24001" {...register("lot_number")} />
            {fieldError(errors.lot_number?.message)}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="expiration_date">
              Expiration date
            </label>
            <Input id="expiration_date" type="date" {...register("expiration_date")} />
            {fieldError(errors.expiration_date?.message)}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="stock_quantity">
              {mode === "create" ? "Opening stock quantity" : "Current stock quantity"}
            </label>
            <Input id="stock_quantity" type="number" min="0" step="1" {...register("stock_quantity")} />
            <p className="mt-2 text-sm text-slate-500">
              {mode === "create"
                ? "Set the opening stock balance for this item lot."
                : "Update the current stock here. Changes are still recorded in the stock movement log."}
            </p>
            {fieldError(errors.stock_quantity?.message)}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="low_stock_threshold">
              Low stock threshold
            </label>
            <Input id="low_stock_threshold" type="number" min="0" step="1" {...register("low_stock_threshold")} />
            {fieldError(errors.low_stock_threshold?.message)}
          </div>

          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="unit_price">
              Unit price
            </label>
            <Input id="unit_price" type="number" min="0" step="0.01" placeholder="0.00" {...register("unit_price")} />
            {fieldError(errors.unit_price?.message)}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700" htmlFor="notes">
            Notes
          </label>
          <Textarea id="notes" placeholder="Optional product notes for staff reference." {...register("notes")} />
          {fieldError(errors.notes?.message)}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
