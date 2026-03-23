import { z } from "zod";

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export const inventoryItemFormSchema = z.object({
  item_name: z.string().trim().min(1, "Item name is required."),
  company_category: z.string().trim().min(1, "Category is required."),
  lot_number: z.string().trim().min(1, "Lot number is required."),
  expiration_date: z
    .string()
    .min(1, "Expiration date is required.")
    .refine(isValidDate, "Enter a valid expiration date."),
  stock_quantity: z.coerce.number().int("Use whole numbers only.").min(0, "Stock quantity cannot be negative."),
  low_stock_threshold: z.coerce.number().int("Use whole numbers only.").min(0, "Threshold cannot be negative."),
  unit_price: z.coerce.number().min(0, "Unit price cannot be negative."),
  notes: z.string().trim().max(500, "Notes must be 500 characters or less.").optional().or(z.literal("")),
});

export const stockAdjustmentSchema = z.object({
  adjustment_type: z.enum(["increase", "decrease"]),
  quantity: z.coerce.number().int("Use whole numbers only.").min(1, "Adjustment quantity must be at least 1."),
  notes: z.string().trim().max(500, "Notes must be 500 characters or less.").optional().or(z.literal("")),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>;
export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;

