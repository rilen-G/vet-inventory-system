import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { inventoryKeys } from "../inventory/hooks";
import type { InvoiceFormValues } from "./schemas";
import { cancelDraftInvoice, createDraftInvoice, finalizeInvoice, getInvoiceDetail, listInvoices, updateDraftInvoice, voidInvoice } from "./api";

export const invoiceKeys = {
  all: ["invoices"] as const,
  detail: (id: number) => ["invoices", id] as const,
};

export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.all,
    queryFn: listInvoices,
  });
}

export function useInvoiceDetail(id: number | null) {
  return useQuery({
    queryKey: id ? invoiceKeys.detail(id) : ["invoices", "detail", "empty"],
    queryFn: () => getInvoiceDetail(id as number),
    enabled: id !== null,
  });
}

export function useCreateDraftInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InvoiceFormValues) => createDraftInvoice(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useUpdateDraftInvoice(invoiceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InvoiceFormValues) => updateDraftInvoice(invoiceId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
    },
  });
}

export function useCancelDraftInvoice(invoiceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelDraftInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
    },
  });
}

export function useFinalizeInvoice(invoiceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => finalizeInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useVoidInvoice(invoiceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (voidReason: string) => voidInvoice(invoiceId, voidReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

