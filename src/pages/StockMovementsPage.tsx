import { useEffect, useMemo, useState } from "react";

import { SupabaseRequired } from "../components/feedback/supabase-required";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { Input } from "../components/ui/input";
import { PageHeader } from "../components/ui/page-header";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
} from "../components/ui/table";
import { isSupabaseConfigured } from "../lib/env";
import { formatDate } from "../lib/utils";
import { useStockMovements } from "../features/inventory/hooks";
import { describeMovementQuantity } from "../features/inventory/utils";

const movementTypeOptions = ["all", "STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "VOID_REVERSAL"] as const;

function getMovementTone(type: string) {
  switch (type) {
    case "STOCK_OUT":
      return "danger";
    case "ADJUSTMENT":
      return "warning";
    case "VOID_REVERSAL":
      return "info";
    default:
      return "success";
  }
}

export function StockMovementsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [movementType, setMovementType] = useState<(typeof movementTypeOptions)[number]>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const movementsQuery = useStockMovements();
  const pageSize = 10;

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Stock Movement Log"
          description="Connect Supabase first, then this page will show stock-in, stock-out, adjustment, and void restoration activity."
        />
        <SupabaseRequired />
      </div>
    );
  }

  const movements = movementsQuery.data ?? [];
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredMovements = useMemo(
    () =>
      movements.filter((movement) => {
        const matchesType = movementType === "all" || movement.movement_type === movementType;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          (movement.item_name ?? "").toLowerCase().includes(normalizedSearch) ||
          (movement.lot_number ?? "").toLowerCase().includes(normalizedSearch) ||
          (movement.reference_type ?? "").toLowerCase().includes(normalizedSearch) ||
          (movement.notes ?? "").toLowerCase().includes(normalizedSearch);

        return matchesType && matchesSearch;
      }),
    [movementType, movements, normalizedSearch],
  );
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / pageSize));
  const paginatedMovements = filteredMovements.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const emptyRows = filteredMovements.length >= pageSize ? pageSize - paginatedMovements.length : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, movementType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movement Log"
        description="Review stock-in, stock-out, manual adjustments, and void restorations in one place."
      />

      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Movement history</h3>
            <p className="mt-1 text-sm text-slate-600">Latest inventory movements recorded across manual updates and invoice actions.</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.6fr_0.7fr]">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by item, lot, reference, or note"
            />
            <Select value={movementType} onChange={(event) => setMovementType(event.target.value as (typeof movementTypeOptions)[number])}>
              <option value="all">All movement types</option>
              <option value="STOCK_IN">Stock in</option>
              <option value="STOCK_OUT">Stock out</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="VOID_REVERSAL">Void restoration</option>
            </Select>
          </div>
        </div>

        {movementsQuery.isLoading ? <p className="mt-6 text-sm text-slate-500">Loading stock movements...</p> : null}
        {movementsQuery.isError ? <p className="mt-6 text-sm text-rose-700">{movementsQuery.error.message}</p> : null}

        {!movementsQuery.isLoading && !movementsQuery.isError && movements.length === 0 ? (
          <div>
            <EmptyState
              title="No stock movements yet"
              description="Inventory adjustments, finalized invoices, and voided invoices will appear here once recorded."
            />
          </div>
        ) : null}

        {!movementsQuery.isLoading && !movementsQuery.isError && movements.length > 0 && filteredMovements.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No matching stock movements"
              description="Try a different search term or movement type to view the full log again."
            />
          </div>
        ) : null}

        {!movementsQuery.isLoading && !movementsQuery.isError && filteredMovements.length > 0 ? (
          <div className="mt-6">
            <TableContainer>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>Lot</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Quantity</TableHeaderCell>
                    <TableHeaderCell>Reference</TableHeaderCell>
                    <TableHeaderCell>Notes</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {paginatedMovements.map((movement) => (
                    <tr key={movement.id}>
                      <TableCell>{movement.created_at ? formatDate(movement.created_at) : "Unknown"}</TableCell>
                      <TableCell className="font-medium text-slate-900">{movement.item_name ?? "Inventory item"}</TableCell>
                      <TableCell>{movement.lot_number ?? "No lot"}</TableCell>
                      <TableCell>
                        <Badge tone={getMovementTone(movement.movement_type)} className="min-w-[7.5rem] justify-center text-center">
                          {movement.movement_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{describeMovementQuantity(movement)}</TableCell>
                      <TableCell>{movement.reference_type ?? "Manual"}</TableCell>
                      <TableCell>{movement.notes ?? "No note"}</TableCell>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRows }).map((_, index) => (
                    <tr key={`movement-empty-${index}`} aria-hidden="true">
                      <TableCell colSpan={7} className="h-[73px] bg-white" />
                    </tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMovements.length}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
