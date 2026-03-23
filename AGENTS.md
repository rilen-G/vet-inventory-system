# AGENTS.md

## Project
Build a web-based prototype for a veterinary product distribution business.

## Goal
Create a demo-ready inventory, sales invoice, and payment monitoring system for a non-technical client.

## Product summary
The client currently uses spreadsheets/manual processes for inventory and handwritten receipts.
They want a system that can:
- track inventory with item name, lot number, expiration date, and stock quantity
- show low stock alerts
- show near-expiry and expired alerts
- create sales invoices
- deduct inventory automatically when invoice is finalized
- record payments and generate receipts
- restore stock when a finalized invoice is voided
- run on 2 office computers with shared data
- optionally be accessible on phone through a browser

## Platform decision
Build this as a web app, not a native desktop app.
Reason:
- client did not require a native installed app
- they want access on 2 computers
- phone access is acceptable
- internet-based access is acceptable

## Tech stack
- React + Vite
- Tailwind CSS
- Supabase
- PDF export for invoices and receipts
- Excel export for invoices/reports

## Constraints
- No authentication for now
- No user roles for now
- No advanced accounting
- No offline mode
- No supplier module unless needed minimally
- Focus on prototype realism, not enterprise completeness

## Main business rules
- Draft invoices do not affect stock
- Finalized invoices deduct stock
- Cancelled is only for draft invoices
- Voided is only for finalized invoices
- Voiding restores stock
- If payments exist, block voiding
- Low stock = stock quantity <= low stock threshold
- Near expiry = expiration date within 60 days from today
- Expired = expiration date before today
- Finalized invoices can receive payments
- Draft invoices cannot receive payments
- Finalized invoices should not be freely edited; use void + recreate flow for major corrections

## Required modules
1. Dashboard
2. Inventory
3. Sales invoices
4. Payments and receipts
5. Reports
6. Stock movement log

## UX rules
- Use client-friendly labels
- Avoid technical jargon in the UI
- Keep screens simple, clean, and business-like
- Optimize for a live client demo
- Use realistic sample data
- Make warning states obvious but not cluttered

## Priority order
1. Inventory module
2. Invoice draft/finalize flow
3. Payment/receipt flow
4. Alerts
5. Reports/export

## Working style
Before coding:
- read AGENTS.md and docs/ first
- outline the plan
- list assumptions
- identify files to change

During implementation:
- keep code modular
- use reusable UI components where sensible
- avoid overengineering
- prefer small, testable steps

After implementation:
- summarize what was built
- list anything unfinished
- list shortcuts taken for prototype purposes
- explain how to run/test the feature locally

## Definition of done for MVP
The MVP is successful if:
- inventory items can be added and edited
- low stock and expiry alerts work
- invoices can be created and saved as draft
- finalizing invoices deducts stock
- payments can be recorded for finalized invoices
- receipts can be generated
- voiding finalized invoices restores stock
- paid invoices cannot be voided directly
- system is understandable to a non-technical client