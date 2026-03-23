import { z } from "zod";

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export const invoiceLineItemSchema = z.object({
  inventory_item_id: z.coerce.number().int().positive("Select an inventory item."),
  quantity: z.coerce.number().int("Use whole numbers only.").min(1, "Quantity must be at least 1."),
  unit_price: z.coerce.number().min(0, "Unit price cannot be negative."),
});

export const invoiceFormSchema = z
  .object({
    customer_name: z.string().trim().min(1, "Customer name is required."),
    customer_address: z.string().trim().max(500, "Address must be 500 characters or less.").optional().or(z.literal("")),
    customer_contact: z.string().trim().max(100, "Contact number must be 100 characters or less.").optional().or(z.literal("")),
    invoice_date: z.string().min(1, "Invoice date is required.").refine(isValidDate, "Enter a valid invoice date."),
    due_date: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || isValidDate(value), "Enter a valid due date."),
    notes: z.string().trim().max(500, "Notes must be 500 characters or less.").optional().or(z.literal("")),
    line_items: z.array(invoiceLineItemSchema).min(1, "Add at least one invoice line item."),
  })
  .superRefine((values, context) => {
    const seenIds = new Set<number>();

    values.line_items.forEach((item, index) => {
      if (seenIds.has(item.inventory_item_id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each inventory lot can only be added once per invoice.",
          path: ["line_items", index, "inventory_item_id"],
        });
      }

      seenIds.add(item.inventory_item_id);
    });

    if (values.due_date && new Date(values.due_date).getTime() < new Date(values.invoice_date).getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date cannot be earlier than invoice date.",
        path: ["due_date"],
      });
    }
  });

export const voidInvoiceSchema = z.object({
  void_reason: z.string().trim().min(1, "Void reason is required.").max(500, "Void reason must be 500 characters or less."),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type VoidInvoiceValues = z.infer<typeof voidInvoiceSchema>;

