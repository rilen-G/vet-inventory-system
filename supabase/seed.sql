truncate table public.payments restart identity cascade;
truncate table public.invoice_items restart identity cascade;
truncate table public.invoices restart identity cascade;
truncate table public.stock_movements restart identity cascade;
truncate table public.inventory_items restart identity cascade;

insert into public.inventory_items
  (item_name, company_category, lot_number, expiration_date, stock_quantity, low_stock_threshold, unit_price, notes)
values
  ('Canine Vaccine A', 'Vaccines', 'CVA-24001', current_date + 180, 20, 5, 350.00, 'Fast-moving vaccine for dog clinics.'),
  ('Feline Vaccine B', 'Vaccines', 'FVB-24003', current_date + 35, 10, 5, 420.00, 'Near-expiry demo item.'),
  ('Dewormer Syrup', 'Medicines', 'DWS-23119', current_date - 7, 12, 4, 180.00, 'Expired demo item for alert testing.'),
  ('Vitamin Supplement', 'Supplements', 'VTS-24022', current_date + 210, 5, 5, 95.00, 'Low stock demo item.'),
  ('Antibiotic Injectable', 'Medicines', 'ABI-24018', current_date + 14, 4, 3, 280.00, 'Near-expiry medicine with limited balance.'),
  ('Surgical Disinfectant', 'Clinic Supplies', 'SDI-24004', current_date + 90, 18, 6, 210.00, 'Stable stock item for normal inventory state.');

insert into public.stock_movements
  (inventory_item_id, movement_type, quantity, reference_type, reference_id, notes)
values
  (1, 'STOCK_IN', 6, 'SEED', 1, 'Additional delivery received for demo history.'),
  (1, 'ADJUSTMENT', -2, 'SEED', 2, 'Damaged items removed from stock.'),
  (2, 'ADJUSTMENT', -2, 'SEED', 3, 'Manual count correction after stock check.'),
  (4, 'ADJUSTMENT', -2, 'SEED', 4, 'Manual count correction after office review.'),
  (5, 'ADJUSTMENT', -2, 'SEED', 5, 'Two vials transferred to a priority customer order.');

insert into public.invoices
  (invoice_number, customer_name, customer_address, customer_contact, invoice_date, due_date, status, subtotal, total, notes)
values
  ('INV-202603-001', 'Happy Paws Animal Clinic', '123 Mabini Street, Quezon City', '0917-555-0101', current_date - 1, current_date + 14, 'Draft', 700.00, 700.00, 'Draft invoice ready for review.'),
  ('INV-202603-002', 'Pet Care Veterinary Center', '45 Rizal Avenue, Manila', '0917-555-0102', current_date - 4, current_date + 10, 'Draft', 1075.00, 1075.00, 'Finalized demo invoice.'),
  ('INV-202603-003', 'Northside Animal Wellness', '8 Laurel Drive, Pasig', '0917-555-0103', current_date - 2, current_date + 12, 'Draft', 95.00, 95.00, 'Cancelled draft for demo history.'),
  ('INV-202603-004', 'Sunrise Vet Supply', '16 Sampaguita Road, Marikina', '0917-555-0104', current_date - 6, current_date + 7, 'Draft', 700.00, 700.00, 'Invoice later voided for demo history.');

insert into public.invoice_items
  (invoice_id, inventory_item_id, item_name_snapshot, lot_number_snapshot, quantity, unit_price, line_total)
values
  ((select id from public.invoices where invoice_number = 'INV-202603-001'), 1, 'Canine Vaccine A', 'CVA-24001', 2, 350.00, 700.00),
  ((select id from public.invoices where invoice_number = 'INV-202603-002'), 1, 'Canine Vaccine A', 'CVA-24001', 1, 350.00, 350.00),
  ((select id from public.invoices where invoice_number = 'INV-202603-002'), 4, 'Vitamin Supplement', 'VTS-24022', 1, 95.00, 95.00),
  ((select id from public.invoices where invoice_number = 'INV-202603-002'), 6, 'Surgical Disinfectant', 'SDI-24004', 3, 210.00, 630.00),
  ((select id from public.invoices where invoice_number = 'INV-202603-003'), 4, 'Vitamin Supplement', 'VTS-24022', 1, 95.00, 95.00),
  ((select id from public.invoices where invoice_number = 'INV-202603-004'), 2, 'Feline Vaccine B', 'FVB-24003', 1, 420.00, 420.00),
  ((select id from public.invoices where invoice_number = 'INV-202603-004'), 5, 'Antibiotic Injectable', 'ABI-24018', 1, 280.00, 280.00);

select public.finalize_invoice((select id from public.invoices where invoice_number = 'INV-202603-002'));
select public.finalize_invoice((select id from public.invoices where invoice_number = 'INV-202603-004'));
select public.void_invoice((select id from public.invoices where invoice_number = 'INV-202603-004'), 'Customer requested reissue with corrected clinic details.');

update public.invoices
set status = 'Cancelled',
    updated_at = now()
where invoice_number = 'INV-202603-003';

insert into public.invoices
  (invoice_number, customer_name, customer_address, customer_contact, invoice_date, due_date, status, subtotal, total, notes)
values
  ('INV-202603-005', 'Green Meadows Veterinary Clinic', '27 Orchard Street, Antipolo', '0917-555-0105', current_date - 3, current_date + 9, 'Draft', 210.00, 210.00, 'Partially paid demo invoice.'),
  ('INV-202603-006', 'South City Pet Hub', '88 Emerald Avenue, Taguig', '0917-555-0106', current_date - 5, current_date + 5, 'Draft', 350.00, 350.00, 'Fully paid demo invoice.');

insert into public.invoice_items
  (invoice_id, inventory_item_id, item_name_snapshot, lot_number_snapshot, quantity, unit_price, line_total)
values
  ((select id from public.invoices where invoice_number = 'INV-202603-005'), 6, 'Surgical Disinfectant', 'SDI-24004', 1, 210.00, 210.00),
  ((select id from public.invoices where invoice_number = 'INV-202603-006'), 1, 'Canine Vaccine A', 'CVA-24001', 1, 350.00, 350.00);

select public.finalize_invoice((select id from public.invoices where invoice_number = 'INV-202603-005'));
select public.finalize_invoice((select id from public.invoices where invoice_number = 'INV-202603-006'));

select public.record_payment(
  (select id from public.invoices where invoice_number = 'INV-202603-005'),
  'RCPT-202603-001',
  current_date - 1,
  'Cash',
  100.00,
  'Initial cash payment for the finalized invoice.'
);

select public.record_payment(
  (select id from public.invoices where invoice_number = 'INV-202603-006'),
  'RCPT-202603-002',
  current_date,
  'Bank Transfer',
  350.00,
  'Paid in full through bank transfer.'
);
