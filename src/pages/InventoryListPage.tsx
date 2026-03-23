import { useState } from "react";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Button } from "../components/ui/button";
import { ButtonLink } from "../components/ui/button-link";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { Input } from "../components/ui/input";
import { PageHeader } from "../components/ui/page-header";
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
import { useInventoryItems } from "../features/inventory/hooks";
import type { InventoryStatusFilter } from "../features/inventory/types";
import { isExpired, isLowStock, isNearExpiry, matchesInventoryFilter } from "../features/inventory/utils";

export function InventoryListPage() {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const inventoryQuery = useInventoryItems();

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

    return matchesSearch && matchesCategory && matchesInventoryFilter(item, statusFilter);
  });
  const categories = Array.from(new Set(items.map((item) => item.company_category).filter(Boolean))).sort();
  const totalItems = items.length;
  const lowStockCount = items.filter((item) => isLowStock(item) && !isExpired(item.expiration_date)).length;
  const nearExpiryCount = items.filter((item) => isNearExpiry(item.expiration_date)).length;
  const expiredCount = items.filter((item) => isExpired(item.expiration_date)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Manage product lots, track stock balances, and edit stock and threshold values from the item form."
        action={<ButtonLink to="/inventory/new">Add item</ButtonLink>}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Item Lots" value={String(totalItems)} detail="All inventory records currently stored." />
        <StatCard label="Low Stock" value={String(lowStockCount)} detail="Item lots at or below their threshold." />
        <StatCard label="Near Expiry" value={String(nearExpiryCount)} detail="Item lots expiring within 60 days." />
        <StatCard label="Expired" value={String(expiredCount)} detail="Item lots already past expiration date." />
      </div>

      <Card>
        <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by item name, lot number, or category"
          />
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
            }}
          >
            Clear filters
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Inventory list</h3>
            <p className="mt-1 text-sm text-slate-600">Search and filter inventory lots, then open an item to edit details, stock, and threshold.</p>
          </div>
          <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700">
            Showing {filteredItems.length} of {items.length}
          </div>
        </div>

        {inventoryQuery.isLoading ? <p className="mt-6 text-sm text-slate-500">Loading inventory items...</p> : null}
        {inventoryQuery.isError ? <p className="mt-6 text-sm text-rose-700">{inventoryQuery.error.message}</p> : null}

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
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <TableCell className="font-medium text-slate-900">
                        <div>{item.item_name}</div>
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
                        <ButtonLink className="px-3 py-2 text-xs" variant="secondary" to={`/inventory/${item.id}/edit`}>
                          Edit
                        </ButtonLink>
                      </TableCell>
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
