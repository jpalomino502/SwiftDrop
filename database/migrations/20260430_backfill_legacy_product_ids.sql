-- Backfill legacy product IDs for seeded/catalog products that were created without them.
-- This keeps storefront links and detail pages working on existing databases.

begin;

with max_id as (
  select coalesce(max(legacy_product_id), 0) as max_id
  from public.products
), numbered as (
  select
    id,
    row_number() over (order by created_at, slug) as rn
  from public.products
  where legacy_product_id is null
)
update public.products p
set legacy_product_id = max_id.max_id + numbered.rn
from numbered, max_id
where p.id = numbered.id;

commit;