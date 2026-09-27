-- Latest price per variant, for the admin rate screen.
-- security_invoker: the view obeys the caller's RLS, so anon still sees nothing.
create or replace view latest_rates with (security_invoker = true) as
select distinct on (variant_id) variant_id, rate_date, price
from rates
order by variant_id, rate_date desc;

grant select on latest_rates to authenticated;
