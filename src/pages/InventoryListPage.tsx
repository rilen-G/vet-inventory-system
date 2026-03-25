import { useEffect, useState } from "react";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Button } from "../components/ui/button";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { EmptyState } from "../components/ui/empty-state";
import { Input } from "../components/ui/input";
import { PageHeader } from "../components/ui/page-header";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { StatCard } from "../components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
} from "../components/ui/table";
import { isSupabaseConfigured } from "../lib/env";
import { formatCurrency, formatDate } from "../lib/utils";
import { InventoryStatusBadge } from "../features/inventory/components/inventory-status-badge";
import { useInventoryItems, useSetInventoryItemArchived } from "../features/inventory/hooks";
import type { InventoryAvailabilityFilter, InventoryItem, InventoryStatusFilter } from "../features/inventory/types";
import { isExpired, isLowStock, isNearExpiry, matchesInventoryFilter } from "../features/inventory/utils";

export function InventoryListPage() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<InventoryAvailabilityFilter>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingArchiveItem, setPendingArchiveItem] = useState<InventoryItem | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const inventoryQuery = useInventoryItems(true);
  const setArchivedMutation = useSetInventoryItemArchived();
  const pageSize = 10;

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Inventory"
          description="Connect Supabase first, then this page will show live stock balances, status badges, search, and edit access for each item."
          action={<ButtonLink to="/inventory/new">Add item</ButtonLink>}
        />
        <SupabaseRequired />
      </div>
    );
  }

  const items = inventoryQuery.data ?? [];
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      item.item_name.toLowerCase().includes(normalizedSearch) ||
      item.lot_number.toLowerCase().includes(normalizedSearch) ||
      (item.company_category ?? "").toLowerCase().includes(normalizedSearch);

    const matchesCategory = categoryFilter === "all" || item.company_category === categoryFilter;
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "active" ? !item.is_archived : item.is_archived);

    return matchesSearch && matchesCategory && matchesAvailability && matchesInventoryFilter(item, statusFilter);
  });
  const categories = Array.from(new Set(items.map((item) => item.company_category).filter(Boolean))).sort();
  const activeItems = items.filter((item) => !item.is_archived);
  const archivedCount = items.length - activeItems.length;
  const totalItems = activeItems.length;
  const lowStockCount = activeItems.filter((item) => isLowStock(item) && !isExpired(item.expiration_date)).length;
  const nearExpiryCount = activeItems.filter((item) => isNearExpiry(item.expiration_date)).length;
  const expiredCount = activeItems.filter((item) => isExpired(item.expiration_date)).length;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const emptyRows = filteredItems.length >= pageSize ? pageSize - paginatedItems.length : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, statusFilter, categoryFilter, availabilityFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage product lots, track stock balances, and edit stock and threshold values from the item form."
        action={<ButtonLink to="/inventory/new">Add item</ButtonLink>}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Item Lots" value={String(totalItems)} detail={`Archived lots: ${archivedCount}`} />
        <StatCard label="Low Stock" value={String(lowStockCount)} detail="Item lots at or below their threshold." />
        <StatCard label="Near Expiry" value={String(nearExpiryCount)} detail="Item lots expiring within 60 days." />
        <StatCard label="Expired" value={String(expiredCount)} detail="Item lots already past expiration date." />
      </div>

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Inventory list</h3>
            <p className="mt-1 text-sm text-slate-600">Search and filter inventory lots, then open an item to edit details, stock, and threshold.</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by item name, lot number, or category"
            />
            <Select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as InventoryAvailabilityFilter)}>
              <option value="active">Active items</option>
              <option value="archived">Archived items</option>
              <option value="all">All items</option>
            </Select>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as InventoryStatusFilter)}>
              <option value="all">All statuses</option>
              <option value="low-stock">Low stock</option>
              <option value="near-expiry">Near expiry</option>
              <option value="expired">Expired</option>
            </Select>
            <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category ?? ""}>
                  {category}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchValue("");
                setStatusFilter("all");
                setCategoryFilter("all");
                setAvailabilityFilter("active");
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>

        {inventoryQuery.isLoading ? <p className="mt-6 text-sm text-slate-500">Loading inventory items...</p> : null}
        {inventoryQuery.isError ? <p className="mt-6 text-sm text-rose-700">{inventoryQuery.error.message}</p> : null}
        {archiveError ? <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{archiveError}</div> : null}

        {!inventoryQuery.isLoading && !inventoryQuery.isError && items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No inventory items yet"
              description="Use the Add item button to create the first product lot."
              action={<ButtonLink to="/inventory/new">Create first item</ButtonLink>}
            />
          </div>
        ) : null}

        {!inventoryQuery.isLoading && !inventoryQuery.isError && items.length > 0 && filteredItems.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No matching items"
              description="Try a different search term or clear the filters to see the full inventory list again."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchValue("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setAvailabilityFilter("active");
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          </div>
        ) : null}

        {!inventoryQuery.isLoading && !inventoryQuery.isError && filteredItems.length > 0 ? (
          <div className="mt-6">
            <TableContainer>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>Category</TableHeaderCell>
                    <TableHeaderCell>Lot Number</TableHeaderCell>
                    <TableHeaderCell>Expiry</TableHeaderCell>
                    <TableHeaderCell>Stock</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Unit Price</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <tr key={item.id}>
                      <TableCell className="font-medium text-slate-900">
                        <div>{item.item_name}</div>
                        {item.is_archived ? <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Archived</div> : null}
                        {item.notes ? <div className="mt-1 text-xs text-slate-500">{item.notes}</div> : null}
                      </TableCell>
                      <TableCell>{item.company_category ?? "Uncategorized"}</TableCell>
                      <TableCell>{item.lot_number}</TableCell>
                      <TableCell>{formatDate(item.expiration_date)}</TableCell>
                      <TableCell>{item.stock_quantity}</TableCell>
                      <TableCell>
                        <InventoryStatusBadge item={item} />
                      </TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <ButtonLink
                            className="h-9 w-9 rounded-full border-0 bg-transparent p-0 hover:bg-stone-100"
                            variant="ghost"
                            to={`/inventory/${item.id}/edit`}
                            title="Edit"
                            aria-label="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </ButtonLink>
                          <Button
                            className="h-9 w-9 rounded-full border-0 p-0"
                            variant="ghost"
                            onClick={() => {
                              setArchiveError(null);
                              setPendingArchiveItem(item);
                            }}
                            disabled={setArchivedMutation.isPending}
                            title={item.is_archived ? "Restore" : "Archive"}
                            aria-label={item.is_archived ? "Restore" : "Archive"}
                          >
                            {item.is_archived ? (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                              </svg>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRows }).map((_, index) => (
                    <tr key={`inventory-empty-${index}`} aria-hidden="true">
                      <TableCell colSpan={8} className="h-[73px] bg-white" />
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
          </div>
        ) : null}
      </Card>

      <ConfirmDialog
        open={pendingArchiveItem !== null}
        onClose={() => setPendingArchiveItem(null)}
        onConfirm={async () => {
          if (!pendingArchiveItem) {
            return;
          }

          setArchiveError(null);

          try {
            await setArchivedMutation.mutateAsync({
              id: pendingArchiveItem.id,
              isArchived: !pendingArchiveItem.is_archived,
            });
            setPendingArchiveItem(null);
          } catch (error) {
            setArchiveError(error instanceof Error ? error.message : "Unable to update this item.");
          }
        }}
        title={pendingArchiveItem?.is_archived ? "Restore inventory item" : "Archive inventory item"}
        description={
          pendingArchiveItem?.is_archived
            ? "Restoring this item makes it available again in inventory and invoice selection."
            : "Archiving hides this item from normal inventory and invoice selection, but keeps its history intact."
        }
        confirmLabel={pendingArchiveItem?.is_archived ? "Restore item" : "Archive item"}
        confirmVariant={pendingArchiveItem?.is_archived ? "primary" : "danger"}
        isConfirming={setArchivedMutation.isPending}
      />
    </div>
  );
}
