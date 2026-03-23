import { Badge } from "../../../components/ui/badge";
import type { InvoiceStatus } from "../types";
import { invoiceStatusTone } from "../utils";

type InvoiceStatusBadgeProps = {
  status: InvoiceStatus;
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <Badge tone={invoiceStatusTone(status)} className="min-w-[6.0rem] justify-center text-center">
      {status}
    </Badge>
  );
}
