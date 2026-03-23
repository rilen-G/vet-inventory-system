# Meeting Summary

## Confirmed requirements

### Inventory system
- track item name
- track lot number
- track expiration date
- low stock alert
- alert for nearing expiration
- alert for expired items
- real-time stock level monitoring
- stock automatically decreases when invoice is finalized
- stock automatically increases when invoice is voided or restored through system logic
- at most 2 people use the software at once

### Sales invoice system
- invoices can be edited after saving while still in draft
- inventory is deducted when invoice is finalized
- invoice should include:
    - customer name
    - date
    - due date
    - address/contact number
    - probably logo
- invoices can be exported as Excel or PDF

### Receipts / payment system
- payment methods:
    - cash
    - GCash
    - bank transfer
    - check
- receipts should be printable and downloadable

### Other details
- no need for different accounts
- system will run on 2 different computers
- phone access is okay
- internet-based access is acceptable

## Interpretation
The client is flexible about whether the system is opened through a browser or feels app-like.
Their main concern is accessibility and convenience.
This supports a web-based prototype.

## Open questions
- should lot selection during invoicing be manual or automatic?
- should the system support stock-in/receiving entries in MVP?
- what exact invoice/receipt layout should be followed?
- should check payments track maturity or clearing dates?