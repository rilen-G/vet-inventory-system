import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invoiceKeys } from "../invoices/hooks";
import { listPaymentsWithInvoices, getPaymentDetail, recordPayment } from "./api";
import type { PaymentFormValues } from "./schemas";

export const paymentKeys = {
  all: ["payments"] as const,
  detail: (id: number) => ["payments", id] as const,
};

export function usePayments() {
  return useQuery({
    queryKey: paymentKeys.all,
    queryFn: listPaymentsWithInvoices,
  });
}

export function usePaymentDetail(id: number | null) {
  return useQuery({
    queryKey: id ? paymentKeys.detail(id) : ["payments", "detail", "empty"],
    queryFn: () => getPaymentDetail(id as number),
    enabled: id !== null,
  });
}

export function useRecordPayment(invoiceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: PaymentFormValues) => recordPayment(invoiceId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
    },
  });
}
