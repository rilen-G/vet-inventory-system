# Requirements

## Functional requirements

### 1. Dashboard
The system must provide a dashboard showing:
- total items
- low stock items
- near-expiry items
- expired items
- draft invoices
- finalized invoices
- unpaid invoices
- recent activities

### 2. Inventory module
The system must allow users to:
- add inventory items
- edit inventory items
- search inventory items
- filter inventory items
- manually adjust stock

Each inventory item should include:
- item name
- company/category
- lot number
- expiration date
- stock quantity
- low stock threshold
- unit price
- notes (optional)

The system must show status indicators:
- in stock
- low stock
- near expiry
- expired

### 3. Sales invoice module
The system must allow users to:
- create invoices
- save invoices as draft
- edit draft invoices
- finalize invoices
- view invoice list
- view invoice details
- void finalized invoices
- cancel draft invoices
- export invoices to PDF
- export invoices to Excel
- print invoices

Invoice fields:
- invoice number
- customer name
- customer address
- customer contact number
- invoice date
- due date
- notes
- subtotal
- total
- status

Invoice line item fields:
- inventory item
- quantity
- unit price
- line total
- lot number snapshot if needed

### 4. Payments and receipts module
The system must allow users to:
- record payments against finalized invoices
- choose payment method
- view payment history
- generate printable/downloadable receipts

Supported payment methods:
- cash
- GCash
- bank transfer
- check

Receipt fields:
- receipt number
- invoice reference
- customer name
- payment date
- payment method
- amount paid
- notes

### 5. Reports module
The system should provide:
- inventory report
- low stock report
- expiry report
- invoice status report
- payment history report

### 6. Stock movement log
The system should store stock movement history for traceability.

## Non-functional requirements
- web-based and browser accessible
- shared data for 2 office computers
- simple and easy to learn
- responsive and usable on phone if needed
- clear and readable interface
- suitable for demo and prototype presentation

## Out of scope for MVP
- authentication
- user roles
- advanced accounting
- supplier management
- offline support
- barcode scanning
- multi-branch support
- complex tax handling