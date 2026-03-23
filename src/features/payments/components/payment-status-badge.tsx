import { Badge } from "../../../components/ui/badge";
import type { InvoicePaymentStatus } from "../../invoices/types";
import { invoicePaymentStatusTone } from "../../invoices/utils";

type PaymentStatusBadgeProps = {
  status: InvoicePaymentStatus;
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <Badge tone={invoicePaymentStatusTone(status)} className="min-w-[6.0rem] justify-center text-center">
      {status}
    </Badge>
  );
}
