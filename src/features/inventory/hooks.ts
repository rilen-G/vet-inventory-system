import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { InventoryItemFormValues, StockAdjustmentValues } from "./schemas";
import {
  adjustInventoryStock,
  createInventoryItem,
  getInventoryItem,
  listInventoryItems,
  listInventoryMovements,
  listRecentStockMovements,
  listStockMovements,
  updateInventoryItem,
} from "./api";

export const inventoryKeys = {
  all: ["inventory"] as const,
  detail: (id: number) => ["inventory", id] as const,
  movements: (id: number) => ["inventory", "movements", id] as const,
  stockMovements: ["inventory", "stock-movements"] as const,
  recentMovements: ["inventory", "recent-movements"] as const,
};

export function useInventoryItems() {
  return useQuery({
    queryKey: inventoryKeys.all,
    queryFn: listInventoryItems,
  });
}

export function useInventoryItem(id: number | null) {
  return useQuery({
    queryKey: id ? inventoryKeys.detail(id) : ["inventory", "detail", "empty"],
    queryFn: () => getInventoryItem(id as number),
    enabled: id !== null,
  });
}

export function useInventoryMovements(id: number | null) {
  return useQuery({
    queryKey: id ? inventoryKeys.movements(id) : ["inventory", "movements", "empty"],
    queryFn: () => listInventoryMovements(id as number),
    enabled: id !== null,
  });
}

export function useRecentStockMovements() {
  return useQuery({
    queryKey: inventoryKeys.recentMovements,
    queryFn: listRecentStockMovements,
  });
}

export function useStockMovements() {
  return useQuery({
    queryKey: inventoryKeys.stockMovements,
    queryFn: listStockMovements,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InventoryItemFormValues) => createInventoryItem(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateInventoryItem(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InventoryItemFormValues) => updateInventoryItem(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
    },
  });
}

export function useAdjustInventoryStock(inventoryItemId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StockAdjustmentValues) => adjustInventoryStock(inventoryItemId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.movements(inventoryItemId) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockMovements });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.recentMovements });
    },
  });
}
