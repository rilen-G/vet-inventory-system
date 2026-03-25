create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.inventory_items (
  id bigint generated always as identity primary key,
  item_name text not null,
  company_category text,
  lot_number text not null,
  expiration_date date not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  is_archived boolean not null default false,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.inventory_items
  add column if not exists is_archived boolean not null default false;

create unique index if not exists inventory_items_lot_number_key
  on public.inventory_items (lot_number);

create index if not exists inventory_items_item_name_idx
  on public.inventory_items (item_name);

create index if not exists inventory_items_company_category_idx
  on public.inventory_items (company_category);

create index if not exists inventory_items_expiration_date_idx
  on public.inventory_items (expiration_date);

create index if not exists inventory_items_is_archived_idx
  on public.inventory_items (is_archived);

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'staff' check (role in ('admin','staff')),
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create unique index if not exists app_users_email_key
  on public.app_users (lower(email));

create index if not exists app_users_role_idx
  on public.app_users (role);

create index if not exists app_users_is_active_idx
  on public.app_users (is_active);

create table if not exists public.invoices (
  id bigint generated always as identity primary key,
  invoice_number text not null unique,
  customer_name text not null,
  customer_address text,
  customer_contact text,
  invoice_date date not null,
  due_date date,
  status text not null check (status in ('Draft','Finalized','Cancelled','Voided')),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  notes text,
  void_reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row
execute function public.set_updated_at();

create table if not exists public.invoice_items (
  id bigint generated always as identity primary key,
  invoice_id bigint not null references public.invoices(id) on delete cascade,
  inventory_item_id bigint not null references public.inventory_items(id),
  item_name_snapshot text not null,
  lot_number_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create index if not exists invoice_items_invoice_id_idx
  on public.invoice_items (invoice_id);

create index if not exists invoice_items_inventory_item_id_idx
  on public.invoice_items (inventory_item_id);

create table if not exists public.payments (
  id bigint generated always as identity primary key,
  invoice_id bigint not null references public.invoices(id) on delete cascade,
  receipt_number text not null unique,
  payment_date date not null,
  payment_method text not null check (payment_method in ('Cash','GCash','Bank Transfer','Check')),
  amount_paid numeric(12,2) not null check (amount_paid > 0),
  notes text,
  created_at timestamp with time zone not null default now()
);

create index if not exists payments_invoice_id_idx
  on public.payments (invoice_id);

create table if not exists public.stock_movements (
  id bigint generated always as identity primary key,
  inventory_item_id bigint not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('STOCK_IN','STOCK_OUT','ADJUSTMENT','VOID_REVERSAL')),
  quantity integer not null check (quantity <> 0),
  reference_type text,
  reference_id bigint,
  notes text,
  created_at timestamp with time zone not null default now()
);

create index if not exists stock_movements_inventory_item_id_idx
  on public.stock_movements (inventory_item_id);

create index if not exists stock_movements_created_at_idx
  on public.stock_movements (created_at desc);

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
as $$
declare
  stock_delta integer;
  updated_row_count integer;
begin
  if new.movement_type = 'ADJUSTMENT' then
    stock_delta := new.quantity;
  elsif new.movement_type in ('STOCK_IN', 'VOID_REVERSAL') then
    if new.quantity <= 0 then
      raise exception 'Quantity must be greater than zero for % movements.', new.movement_type;
    end if;
    stock_delta := new.quantity;
  elsif new.movement_type = 'STOCK_OUT' then
    if new.quantity <= 0 then
      raise exception 'Quantity must be greater than zero for STOCK_OUT movements.';
    end if;
    stock_delta := new.quantity * -1;
  else
    raise exception 'Unsupported stock movement type: %', new.movement_type;
  end if;

  update public.inventory_items
  set stock_quantity = stock_quantity + stock_delta
  where id = new.inventory_item_id
    and stock_quantity + stock_delta >= 0;

  get diagnostics updated_row_count = row_count;

  if updated_row_count = 0 then
    raise exception 'Stock movement would make item % negative or item does not exist.', new.inventory_item_id;
  end if;

  return new;
end;
$$;

drop trigger if exists stock_movements_apply_stock on public.stock_movements;
create trigger stock_movements_apply_stock
after insert on public.stock_movements
for each row
execute function public.apply_stock_movement();

create or replace function public.finalize_invoice(p_invoice_id bigint)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice public.invoices;
  shortage record;
begin
  select *
  into target_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice % not found.', p_invoice_id;
  end if;

  if target_invoice.status <> 'Draft' then
    raise exception 'Only Draft invoices can be finalized.';
  end if;

  if not exists (
    select 1
    from public.invoice_items
    where invoice_id = p_invoice_id
  ) then
    raise exception 'Add at least one line item before finalizing this invoice.';
  end if;

  for shortage in
    select
      ii.inventory_item_id,
      sum(ii.quantity)::integer as required_quantity,
      max(ii.item_name_snapshot) as item_name_snapshot,
      max(ii.lot_number_snapshot) as lot_number_snapshot,
      i.stock_quantity
    from public.invoice_items ii
    join public.inventory_items i
      on i.id = ii.inventory_item_id
    where ii.invoice_id = p_invoice_id
    group by ii.inventory_item_id, i.stock_quantity
    having sum(ii.quantity)::integer > i.stock_quantity
  loop
    raise exception
      'Insufficient stock for % (%). Available: %, requested: %.',
      shortage.item_name_snapshot,
      coalesce(shortage.lot_number_snapshot, 'No lot'),
      shortage.stock_quantity,
      shortage.required_quantity;
  end loop;

  insert into public.stock_movements
    (inventory_item_id, movement_type, quantity, reference_type, reference_id, notes)
  select
    ii.inventory_item_id,
    'STOCK_OUT',
    sum(ii.quantity)::integer,
    'INVOICE',
    p_invoice_id,
    format('Invoice %s finalized.', target_invoice.invoice_number)
  from public.invoice_items ii
  where ii.invoice_id = p_invoice_id
  group by ii.inventory_item_id;

  update public.invoices
  set status = 'Finalized',
      updated_at = now()
  where id = p_invoice_id
  returning *
  into target_invoice;

  return target_invoice;
end;
$$;

create or replace function public.void_invoice(p_invoice_id bigint, p_void_reason text)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice public.invoices;
  normalized_reason text := nullif(btrim(p_void_reason), '');
begin
  select *
  into target_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice % not found.', p_invoice_id;
  end if;

  if target_invoice.status <> 'Finalized' then
    raise exception 'Only Finalized invoices can be voided.';
  end if;

  if normalized_reason is null then
    raise exception 'Void reason is required.';
  end if;

  if exists (
    select 1
    from public.payments
    where invoice_id = p_invoice_id
  ) then
    raise exception 'This invoice has payments. Remove or reverse payments before voiding.';
  end if;

  insert into public.stock_movements
    (inventory_item_id, movement_type, quantity, reference_type, reference_id, notes)
  select
    ii.inventory_item_id,
    'VOID_REVERSAL',
    sum(ii.quantity)::integer,
    'INVOICE_VOID',
    p_invoice_id,
    format('Invoice %s voided. Reason: %s', target_invoice.invoice_number, normalized_reason)
  from public.invoice_items ii
  where ii.invoice_id = p_invoice_id
  group by ii.inventory_item_id;

  update public.invoices
  set status = 'Voided',
      void_reason = normalized_reason,
      updated_at = now()
  where id = p_invoice_id
  returning *
  into target_invoice;

  return target_invoice;
end;
$$;

create or replace function public.record_payment(
  p_invoice_id bigint,
  p_receipt_number text,
  p_payment_date date,
  p_payment_method text,
  p_amount_paid numeric,
  p_notes text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invoice public.invoices;
  existing_paid_total numeric(12,2);
  remaining_balance numeric(12,2);
  new_payment public.payments;
  normalized_receipt_number text := nullif(btrim(p_receipt_number), '');
begin
  select *
  into target_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice % not found.', p_invoice_id;
  end if;

  if target_invoice.status <> 'Finalized' then
    raise exception 'Payments can only be recorded for finalized invoices.';
  end if;

  if normalized_receipt_number is null then
    raise exception 'Receipt number is required.';
  end if;

  if p_payment_method not in ('Cash', 'GCash', 'Bank Transfer', 'Check') then
    raise exception 'Unsupported payment method: %', p_payment_method;
  end if;

  if p_amount_paid <= 0 then
    raise exception 'Payment amount must be greater than zero.';
  end if;

  select coalesce(sum(amount_paid), 0)
  into existing_paid_total
  from public.payments
  where invoice_id = p_invoice_id;

  remaining_balance := target_invoice.total - existing_paid_total;

  if remaining_balance <= 0 then
    raise exception 'This invoice is already fully paid.';
  end if;

  if p_amount_paid > remaining_balance then
    raise exception 'Payment amount exceeds the remaining balance of %.', remaining_balance;
  end if;

  insert into public.payments
    (invoice_id, receipt_number, payment_date, payment_method, amount_paid, notes)
  values
    (p_invoice_id, normalized_receipt_number, p_payment_date, p_payment_method, p_amount_paid, nullif(btrim(p_notes), ''))
  returning *
  into new_payment;

  return new_payment;
end;
$$;

create or replace function public.is_active_app_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.current_app_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_users
  where id = auth.uid();
$$;

revoke all on schema public from anon;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.inventory_items to authenticated;
grant select, insert, update, delete on public.stock_movements to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.invoice_items to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.app_users to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.finalize_invoice(bigint) to authenticated;
grant execute on function public.void_invoice(bigint, text) to authenticated;
grant execute on function public.record_payment(bigint, text, date, text, numeric, text) to authenticated;
grant execute on function public.is_active_app_user() to authenticated;
grant execute on function public.current_app_user_role() to authenticated;

alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.app_users enable row level security;

drop policy if exists inventory_items_open_access on public.inventory_items;
drop policy if exists inventory_items_staff_access on public.inventory_items;
create policy inventory_items_staff_access
on public.inventory_items
for all
to authenticated
using (public.is_active_app_user())
with check (public.is_active_app_user());

drop policy if exists stock_movements_open_access on public.stock_movements;
drop policy if exists stock_movements_staff_access on public.stock_movements;
create policy stock_movements_staff_access
on public.stock_movements
for all
to authenticated
using (public.is_active_app_user())
with check (public.is_active_app_user());

drop policy if exists invoices_open_access on public.invoices;
drop policy if exists invoices_staff_access on public.invoices;
create policy invoices_staff_access
on public.invoices
for all
to authenticated
using (public.is_active_app_user())
with check (public.is_active_app_user());

drop policy if exists invoice_items_open_access on public.invoice_items;
drop policy if exists invoice_items_staff_access on public.invoice_items;
create policy invoice_items_staff_access
on public.invoice_items
for all
to authenticated
using (public.is_active_app_user())
with check (public.is_active_app_user());

drop policy if exists payments_open_access on public.payments;
drop policy if exists payments_staff_access on public.payments;
create policy payments_staff_access
on public.payments
for all
to authenticated
using (public.is_active_app_user())
with check (public.is_active_app_user());

drop policy if exists app_users_self_select on public.app_users;
create policy app_users_self_select
on public.app_users
for select
to authenticated
using (id = auth.uid());

drop policy if exists app_users_admin_manage on public.app_users;
create policy app_users_admin_manage
on public.app_users
for all
to authenticated
using (public.current_app_user_role() = 'admin')
with check (public.current_app_user_role() = 'admin');
