-- Create invoices table to persist invoice numbers and metadata
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  renter_id uuid references public.profiles(id) on delete set null,
  invoice_number text not null unique,
  issue_date timestamptz not null default now(),
  total_amount numeric,
  currency text not null default 'MAD',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Basic RLS allowing owner or renter of the booking to read
alter table public.invoices enable row level security;

do $$ begin
  create policy invoices_select_by_related on public.invoices
  for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = invoices.booking_id
      and (b.owner_id = auth.uid() or b.renter_id = auth.uid() or b.host_id = auth.uid() or b.user_id = auth.uid())
    )
  );
exception when others then null; end $$;

-- Upsert helper function (optional)
create or replace function public.ensure_invoice_for_booking(p_booking_id uuid, p_owner_id uuid, p_renter_id uuid, p_total_amount numeric)
returns public.invoices as $$
declare v_invoice public.invoices;
begin
  select * into v_invoice from public.invoices where booking_id = p_booking_id;
  if not found then
    insert into public.invoices(booking_id, owner_id, renter_id, invoice_number, total_amount)
    values (
      p_booking_id,
      p_owner_id,
      p_renter_id,
      'INV-' || upper(substr(p_booking_id::text, 1, 8)) || '-' || upper(to_hex(extract(epoch from now())::bigint)),
      p_total_amount
    )
    returning * into v_invoice;
  end if;
  return v_invoice;
end; $$ language plpgsql security definer;


