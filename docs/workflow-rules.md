# Workflow Rules

## Invoice statuses

### Draft
- Editable
- No stock movement
- Cannot receive payments
- Can be cancelled

### Finalized
- Official invoice
- Stock is deducted automatically
- Can receive payments
- Can be printed/exported
- Cannot be casually edited

### Cancelled
- Applies only to draft invoices
- No stock movement
- Kept in history if needed

### Voided
- Applies only to finalized invoices
- Requires void reason
- Stock is restored automatically
- Kept visible in history
- Must be clearly marked as VOID

## Payment rules
- Only finalized invoices can receive payments
- If a finalized invoice has payments, block voiding
- Show a clear message explaining that payment reversal/refund is needed first
- Payment status should be:
    - Unpaid
    - Partially Paid
    - Paid

## Stock rules
- Stock decreases only when invoice is finalized
- Stock increases when a finalized invoice is voided
- Stock should not go below zero
- Invoice finalization must be blocked if stock is insufficient

## Alert rules
- Low stock if stock quantity <= low stock threshold
- Near expiry if expiration date is within 60 days from current date
- Expired if expiration date is before current date

## Reporting rules
- Voided invoices remain visible in history
- Voided invoices should be excluded from sales totals
- Receipts should be tied to finalized invoices only

## UI/UX rules
- Use business-friendly labels
- Avoid technical jargon
- Use warning badges for low stock and expiry states
- Use confirmation dialogs for finalize, cancel, and void