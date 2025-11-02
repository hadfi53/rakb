create or replace function get_rental_details()
returns table (
  id uuid,
  vehicle_name text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  total_price numeric,
  owner_id uuid,
  renter_id uuid,
  owner_name text,
  renter_name text,
  status text
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    r.id,
    v.name as vehicle_name,
    r.start_date,
    r.end_date,
    r.total_price,
    v.owner_id,
    r.renter_id,
    owner_profile.first_name || ' ' || owner_profile.last_name as owner_name,
    renter_profile.first_name || ' ' || renter_profile.last_name as renter_name,
    r.status
  from rentals r
  join vehicles v on r.vehicle_id = v.id
  join profiles owner_profile on v.owner_id = owner_profile.id
  join profiles renter_profile on r.renter_id = renter_profile.id
  where r.status in ('confirmed', 'in_progress')
  and (
    auth.uid() = v.owner_id -- User is the owner
    or
    auth.uid() = r.renter_id -- User is the renter
  );
end;
$$; 