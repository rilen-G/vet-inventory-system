import { useNavigate, useParams } from "react-router-dom";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { PageHeader } from "../components/ui/page-header";
import { isSupabaseConfigured } from "../lib/env";
import { InvoiceForm } from "../features/invoices/components/invoice-form";
import { InvoiceStatusBadge } from "../features/invoices/components/invoice-status-badge";
import { useCreateDraftInvoice, useInvoiceDetail, useUpdateDraftInvoice } from "../features/invoices/hooks";
import type { InvoiceFormValues } from "../features/invoices/schemas";
import { useInventoryItems } from "../features/inventory/hooks";

type InvoiceEditorPageProps = {
  mode: "create" | "edit";
};

export function InvoiceEditorPage({ mode }: InvoiceEditorPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceId = mode === "edit" && id ? Number(id) : null;
  const isValidEditId = invoiceId !== null && !Number.isNaN(invoiceId);
  const inventoryItemsQuery = useInventoryItems(true);
  const invoiceDetailQuery = useInvoiceDetail(mode === "edit" && isValidEditId ? invoiceId : null);
  const createMutation = useCreateDraftInvoice();
  const updateMutation = useUpdateDraftInvoice(invoiceId ?? 0);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const activeInventoryItems = (inventoryItemsQuery.data ?? []).filter((item) => !item.is_archived);

  const initialValues: InvoiceFormValues | undefined = invoiceDetailQuery.data
    ? {
        customer_name: invoiceDetailQuery.data.customer_name,
        customer_address: invoiceDetailQuery.data.customer_address ?? "",
        customer_contact: invoiceDetailQuery.data.customer_contact ?? "",
        invoice_date: invoiceDetailQuery.data.invoice_date,
        due_date: invoiceDetailQuery.data.due_date ?? "",
        notes: invoiceDetailQuery.data.notes ?? "",
        line_items: invoiceDetailQuery.data.invoice_items.map((item) => ({
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }
    : undefined;

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={mode === "create" ? "New Invoice" : "Edit Draft Invoice"}
          description="Connect Supabase first, then this page will save invoice drafts."
          action={
            <ButtonLink to="/invoices" variant="secondary">
              Back to invoices
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
          title="Edit Draft Invoice"
          description="The selected invoice could not be identified."
          action={
            <ButtonLink to="/invoices" variant="secondary">
              Back to invoices
            </ButtonLink>
          }
        />
        <Card>
          <p className="text-sm text-rose-700">The invoice ID in the URL is not valid.</p>
        </Card>
      </div>
    );
  }

  const currentInvoice = invoiceDetailQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === "create" ? "New Invoice" : `Edit Draft Invoice${currentInvoice ? ` #${currentInvoice.invoice_number}` : ""}`}
        description={
          mode === "create"
            ? "Create a sales invoice draft using the current inventory lots."
            : "Update customer details and line items while the invoice is still in Draft status."
        }
        action={
          <ButtonLink to="/invoices" variant="secondary">
            Back to invoices
          </ButtonLink>
        }
      />

      {inventoryItemsQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading inventory items for invoice selection...</p>
        </Card>
      ) : null}

      {inventoryItemsQuery.isError ? (
        <Card>
          <p className="text-sm text-rose-700">{inventoryItemsQuery.error.message}</p>
        </Card>
      ) : null}

      {!inventoryItemsQuery.isLoading &&
      !inventoryItemsQuery.isError &&
      ((mode === "create" && activeInventoryItems.length === 0) || (inventoryItemsQuery.data?.length ?? 0) === 0) ? (
        <EmptyState
          title="No inventory items available"
          description="Add or restore an active inventory item first before creating invoices."
          action={<ButtonLink to="/inventory">Go to inventory</ButtonLink>}
        />
      ) : null}

      {mode === "edit" && invoiceDetailQuery.isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Loading invoice draft...</p>
        </Card>
      ) : null}

      {mode === "edit" && invoiceDetailQuery.isError ? (
        <Card>
          <p className="text-sm text-rose-700">{invoiceDetailQuery.error.message}</p>
        </Card>
      ) : null}

      {mode === "edit" && currentInvoice && currentInvoice.status !== "Draft" ? (
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Invoice is no longer editable</h3>
              <p className="mt-1 text-sm text-slate-600">
                Finalized invoices must use the void and recreate flow for major corrections.
              </p>
            </div>
            <InvoiceStatusBadge status={currentInvoice.status} />
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              className="h-9 w-9 rounded-full border border-[#c9ab67]/40 bg-[#fcfaf4] p-0 text-[#b89443] hover:border-[#b89443] hover:bg-[#f8f2e3] hover:text-[#8f6a1d] focus:ring-[#e5d19d]"
              to={`/invoices/${currentInvoice.id}`}
              variant="ghost"
              title="View"
              aria-label="View"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </ButtonLink>
            <ButtonLink to="/invoices">Back to list</ButtonLink>
          </div>
        </Card>
      ) : null}

      {!inventoryItemsQuery.isLoading &&
      !inventoryItemsQuery.isError &&
      ((mode === "create" && activeInventoryItems.length > 0) || mode === "edit") &&
      (mode === "create" || (currentInvoice && currentInvoice.status === "Draft")) ? (
        <InvoiceForm
          mode={mode}
          inventoryItems={inventoryItemsQuery.data ?? []}
          initialValues={initialValues}
          invoiceNumber={currentInvoice?.invoice_number}
          submitLabel={mode === "create" ? "Save draft invoice" : "Save draft changes"}
          isSubmitting={isSubmitting}
          onSubmit={async (values) => {
            if (mode === "create") {
              const createdInvoice = await createMutation.mutateAsync(values);
              navigate(`/invoices/${createdInvoice.id}`);
              return;
            }

            if (invoiceId !== null) {
              await updateMutation.mutateAsync(values);
              navigate(`/invoices/${invoiceId}`);
            }
          }}
        />
      ) : null}
    </div>
  );
}
