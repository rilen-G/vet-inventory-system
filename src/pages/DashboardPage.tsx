import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/ui/page-header";
import { StatCard } from "../components/ui/stat-card";
import { isSupabaseConfigured } from "../lib/env";
import { formatDate } from "../lib/utils";
import { useInvoices } from "../features/invoices/hooks";
import { getInvoiceBalance, getInvoicePaymentStatus } from "../features/invoices/utils";
import { useInventoryItems, useRecentStockMovements } from "../features/inventory/hooks";
import { isExpired, isLowStock, isNearExpiry } from "../features/inventory/utils";
import { usePayments } from "../features/payments/hooks";

export function DashboardPage() {
  const inventoryQuery = useInventoryItems();
  const invoicesQuery = useInvoices();
  const paymentsQuery = usePayments();
  const movementsQuery = useRecentStockMovements();

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Connect Supabase first, then this page will show live inventory, invoice, payment, and activity summaries."
        />
        <SupabaseRequired />
      </div>
    );
  }

  const inventoryItems = inventoryQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const recentMovements = movementsQuery.data ?? [];
  const lowStockCount = inventoryItems.filter((item) => isLowStock(item)).length;
  const nearExpiryCount = inventoryItems.filter((item) => isNearExpiry(item.expiration_date)).length;
  const expiredCount = inventoryItems.filter((item) => isExpired(item.expiration_date)).length;
  const draftCount = invoices.filter((invoice) => invoice.status === "Draft").length;
  const finalizedCount = invoices.filter((invoice) => invoice.status === "Finalized").length;
  const unpaidCount = invoices.filter((invoice) => invoice.status === "Finalized" && getInvoiceBalance(invoice) > 0).length;

  const invoiceActivities = invoices
    .filter((invoice) => invoice.status === "Finalized" || invoice.status === "Voided" || invoice.status === "Cancelled")
    .map((invoice) => ({
      id: `invoice-${invoice.id}`,
      occurredAt: invoice.updated_at ?? invoice.created_at ?? "",
      title:
        invoice.status === "Finalized"
          ? `Invoice finalized: ${invoice.invoice_number}`
          : invoice.status === "Voided"
            ? `Invoice voided: ${invoice.invoice_number}`
            : `Draft cancelled: ${invoice.invoice_number}`,
      subtitle: invoice.customer_name,
    }));

  const paymentActivities = payments.map((payment) => ({
    id: `payment-${payment.id}`,
    occurredAt: payment.created_at ?? payment.payment_date,
    title: `Payment recorded: ${payment.receipt_number}`,
    subtitle: payment.invoice?.invoice_number ?? "Invoice payment",
  }));

  const stockActivities = recentMovements.map((movement) => ({
    id: `stock-${movement.id}`,
    occurredAt: movement.created_at ?? "",
    title: `${movement.movement_type.replace("_", " ")}: ${movement.item_name ?? "Inventory item"}`,
    subtitle: movement.notes ?? movement.lot_number ?? "Stock movement",
  }));

  const recentActivities = [...invoiceActivities, ...paymentActivities, ...stockActivities]
    .filter((activity) => activity.occurredAt)
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live summary of inventory, invoices, payments, and recent business activity."
      />

      {(inventoryQuery.isLoading || invoicesQuery.isLoading || paymentsQuery.isLoading || movementsQuery.isLoading) && (
        <Card>
          <p className="text-sm text-slate-500">Loading dashboard summary...</p>
        </Card>
      )}

      {(inventoryQuery.isError || invoicesQuery.isError || paymentsQuery.isError || movementsQuery.isError) && (
        <Card>
          <p className="text-sm text-rose-700">
            {inventoryQuery.error?.message ||
              invoicesQuery.error?.message ||
              paymentsQuery.error?.message ||
              movementsQuery.error?.message}
          </p>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Item Lots" value={String(inventoryItems.length)} detail="All inventory lots in the system." />
        <StatCard label="Low Stock Items" value={String(lowStockCount)} detail="Lots at or below the low stock threshold." />
        <StatCard label="Near Expiry Items" value={String(nearExpiryCount)} detail="Lots expiring within the next 60 days." />
        <StatCard label="Expired Items" value={String(expiredCount)} detail="Lots already past expiration date." />
        <StatCard label="Draft Invoices" value={String(draftCount)} detail="Invoices waiting for final review." />
        <StatCard label="Finalized Invoices" value={String(finalizedCount)} detail="Official invoices that already affected stock." />
        <StatCard label="Unpaid Invoices" value={String(unpaidCount)} detail="Finalized invoices with remaining balance." />
        <StatCard
          label="Payments Recorded"
          value={String(payments.length)}
          detail={`Paid invoices: ${invoices.filter((invoice) => getInvoicePaymentStatus(invoice) === "Paid").length}`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
          <p className="mt-1 text-sm text-slate-600">Latest stock movements, invoice status changes, and payment entries.</p>

          <div className="mt-6 space-y-4">
            {recentActivities.length === 0 ? (
              <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-slate-600">No recent activity yet.</div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">{activity.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{activity.subtitle}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">{formatDate(activity.occurredAt)}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Alert summary</h3>
          <p className="mt-1 text-sm text-slate-600">Operational alerts that need review during the demo.</p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm font-medium text-slate-700">Low stock</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{lowStockCount}</div>
            </div>
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm font-medium text-slate-700">Near expiry</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{nearExpiryCount}</div>
            </div>
            <div className="rounded-2xl bg-white/90 p-4">
              <div className="text-sm font-medium text-slate-700">Expired</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{expiredCount}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
