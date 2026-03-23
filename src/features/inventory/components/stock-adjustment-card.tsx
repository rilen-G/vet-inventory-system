import { useState } from "react";

import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { useZodForm } from "../../../lib/forms";
import { formatDate } from "../../../lib/utils";
import type { InventoryItem } from "../types";
import { stockAdjustmentSchema, type StockAdjustmentValues } from "../schemas";
import { useAdjustInventoryStock, useInventoryMovements } from "../hooks";
import { describeMovementQuantity } from "../utils";

type StockAdjustmentCardProps = {
  item: InventoryItem;
  onClose: () => void;
};

export function StockAdjustmentCard({ item, onClose }: StockAdjustmentCardProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useZodForm(stockAdjustmentSchema, {
    adjustment_type: "increase",
    quantity: 1,
    notes: "",
  });
  const adjustmentMutation = useAdjustInventoryStock(item.id);
  const movementsQuery = useInventoryMovements(item.id);

  const adjustmentType = form.watch("adjustment_type");
  const quantity = Number(form.watch("quantity") ?? 0);
  const projectedStock = adjustmentType === "decrease" ? item.stock_quantity - quantity : item.stock_quantity + quantity;
  const wouldGoNegative = projectedStock < 0;

  return (
    <Card className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Adjust stock</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Record a manual stock change for <span className="font-semibold text-slate-900">{item.item_name}</span> ({item.lot_number}).
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-5 grid gap-4 rounded-3xl bg-stone-50 p-4 sm:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Current stock</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{item.stock_quantity}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Threshold</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{item.low_stock_threshold}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Projected stock</div>
            <div className={`mt-2 text-2xl font-semibold ${wouldGoNegative ? "text-rose-700" : "text-slate-900"}`}>{projectedStock}</div>
          </div>
        </div>

        <form
          className="mt-6 space-y-5"
          onSubmit={form.handleSubmit(async (values: StockAdjustmentValues) => {
            setSubmitError(null);

            if (wouldGoNegative) {
              setSubmitError("This adjustment would make stock negative. Reduce the quantity or switch to an increase.");
              return;
            }

            try {
              await adjustmentMutation.mutateAsync(values);
              form.reset({ adjustment_type: "increase", quantity: 1, notes: "" });
            } catch (error) {
              setSubmitError(error instanceof Error ? error.message : "Unable to save the stock adjustment.");
            }
          })}
        >
          {submitError ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{submitError}</div> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="adjustment_type">
                Adjustment type
              </label>
              <Select id="adjustment_type" {...form.register("adjustment_type")}>
                <option value="increase">Increase stock</option>
                <option value="decrease">Decrease stock</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700" htmlFor="adjustment_quantity">
                Quantity
              </label>
              <Input id="adjustment_quantity" type="number" min="1" step="1" {...form.register("quantity")} />
              {form.formState.errors.quantity ? (
                <p className="mt-2 text-sm text-rose-700">{form.formState.errors.quantity.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700" htmlFor="adjustment_notes">
              Notes
            </label>
            <Textarea
              id="adjustment_notes"
              placeholder="Explain the reason for this manual adjustment."
              {...form.register("notes")}
            />
            {form.formState.errors.notes ? <p className="mt-2 text-sm text-rose-700">{form.formState.errors.notes.message}</p> : null}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={adjustmentMutation.isPending || wouldGoNegative}>
              {adjustmentMutation.isPending ? "Saving..." : "Save adjustment"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
        <h4 className="text-base font-semibold text-slate-900">Recent stock movement entries</h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          This confirms that manual adjustments are written to the stock movement log.
        </p>

        <div className="mt-4 space-y-3">
          {movementsQuery.isLoading ? <p className="text-sm text-slate-500">Loading movement history...</p> : null}
          {movementsQuery.isError ? (
            <p className="text-sm text-rose-700">{movementsQuery.error.message}</p>
          ) : null}
          {!movementsQuery.isLoading && !movementsQuery.isError && (movementsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-500">No stock movement entries yet for this item.</p>
          ) : null}

          {movementsQuery.data?.map((movement) => (
            <div key={movement.id} className="rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{movement.movement_type.replace("_", " ")}</div>
                  <div className="mt-1 text-sm text-slate-500">{movement.notes ?? "No note provided."}</div>
                </div>
                <div className={`text-sm font-semibold ${movement.quantity < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {describeMovementQuantity(movement)}
                </div>
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                {movement.created_at ? formatDate(movement.created_at, { month: "short", day: "numeric", year: "numeric" }) : "Date unavailable"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
