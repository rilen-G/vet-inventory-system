import { z } from "zod";

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export const paymentFormSchema = z.object({
  payment_date: z.string().min(1, "Payment date is required.").refine(isValidDate, "Enter a valid payment date."),
  payment_method: z.enum(["Cash", "GCash", "Bank Transfer", "Check"]),
  amount_paid: z.coerce.number().positive("Payment amount must be greater than zero."),
  notes: z.string().trim().max(500, "Notes must be 500 characters or less.").optional().or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

