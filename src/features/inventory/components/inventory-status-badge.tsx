import { Badge } from "../../../components/ui/badge";
import type { InventoryItem } from "../types";
import { getInventoryStatus, inventoryStatusTone } from "../utils";

type InventoryStatusBadgeProps = {
  item: InventoryItem;
};

export function InventoryStatusBadge({ item }: InventoryStatusBadgeProps) {
  const status = getInventoryStatus(item);

  return (
    <Badge tone={inventoryStatusTone(status)} className="min-w-[6.0rem] justify-center text-center">
      {status}
    </Badge>
  );
}
