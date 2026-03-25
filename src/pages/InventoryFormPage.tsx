import { useNavigate, useParams } from "react-router-dom";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/ui/page-header";
import { isSupabaseConfigured } from "../lib/env";
import { InventoryForm } from "../features/inventory/components/inventory-form";
import { InventoryStatusBadge } from "../features/inventory/components/inventory-status-badge";
import { useCreateInventoryItem, useInventoryItem, useUpdateInventoryItem } from "../features/inventory/hooks";
import type { InventoryItemFormValues } from "../features/inventory/schemas";

type InventoryFormPageProps = {
  mode: "create" | "edit";
};

export function InventoryFormPage({ mode }: InventoryFormPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const itemId = mode === "edit" && id ? Number(id) : null;
  const isValidEditId = itemId !== null && !Number.isNaN(itemId);
  const inventoryItemQuery = useInventoryItem(mode === "edit" && isValidEditId ? itemId : null);
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem(itemId ?? 0);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={mode === "create" ? "New Inventory Item" : "Edit Inventory Item"}
          description="Connect Supabase first, then this page will save product lots with validation."
          action={
            <ButtonLink to="/inventory" variant="secondary">
              Back to inventory
            </ButtonLink>
          }
        />
        <SupabaseRequired />
      </div>
    );
  }

  if (mode === "edit" && !isValidEditId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Inventory Item"
          description="The selected inventory item could not be identified."
          action={
            <ButtonLink to="/inventory" variant="secondary">
              Back to inventory
            </ButtonLink>
          }
        />
        <Card>
          <p className="text-sm text-rose-700">The inventory item ID in the URL is not valid.</p>
        </Card>
      </div>
    );
  }

  const currentItem = inventoryItemQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "New Inventory Item" : `Edit Inventory Item${currentItem ? ` #${currentItem.id}` : ""}`}
        description={
          mode === "create"
            ? "Create a new product lot with opening stock, pricing, and expiry details."
            : currentItem?.is_archived
              ? "Review or update this archived item. Restoring it is done from the inventory list."
              : "Update lot details, current stock, threshold, pricing, and notes from one screen."
        }
        action={
          <ButtonLink to="/inventory" variant="secondary">
            Back to inventory
          </ButtonLink>
        }
      />

      {mode === "edit" && inventoryItemQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading inventory item...</p>
        </Card>
      ) : null}

      {mode === "edit" && inventoryItemQuery.isError ? (
        <Card>
          <p className="text-sm text-rose-700">{inventoryItemQuery.error.message}</p>
        </Card>
      ) : null}

      {mode === "edit" && currentItem ? (
        <Card className="bg-stone-50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{currentItem.item_name}</h3>
              <p className="mt-1 text-sm text-slate-600">
                Lot {currentItem.lot_number} • Current stock {currentItem.stock_quantity} • Threshold {currentItem.low_stock_threshold}
              </p>
              {currentItem.is_archived ? <p className="mt-2 text-sm font-medium text-stone-600">This item is archived.</p> : null}
            </div>
            <InventoryStatusBadge item={currentItem} />
          </div>
        </Card>
      ) : null}

      {(mode === "create" || currentItem) && (
        <InventoryForm
          mode={mode}
          initialItem={currentItem}
          isSubmitting={isSubmitting}
          submitLabel={mode === "create" ? "Save inventory item" : "Save changes"}
          onSubmit={async (values: InventoryItemFormValues) => {
            if (mode === "create") {
              await createMutation.mutateAsync(values);
            } else if (itemId !== null) {
              await updateMutation.mutateAsync(values);
            }

            navigate("/inventory");
          }}
        />
      )}
    </div>
  );
}
