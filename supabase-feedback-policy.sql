-- Run this in the Supabase SQL Editor for the feedback table.
-- It allows written reviews to publish automatically while keeping rating-only
-- submissions private unless you approve them later.

alter table public.feedback enable row level security;

drop policy if exists "Public can read published feedback" on public.feedback;
create policy "Public can read published feedback"
on public.feedback
for select
to anon
using (
  approved = true
  or nullif(btrim(message), '') is not null
);

drop policy if exists "Public can submit feedback" on public.feedback;
create policy "Public can submit feedback"
on public.feedback
for insert
to anon
with check (
  rating between 1 and 5
  and (
    approved = false
    or nullif(btrim(message), '') is not null
  )
);
