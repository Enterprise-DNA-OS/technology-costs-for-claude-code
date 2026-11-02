create or replace view showback as
 select r.id as run_id,p.name as period,p.currency,x.service,x.unit,round(x.amount_cents::numeric/100,2) as amount,
 x.weight,x.driver_basis,case when r.revision<>p.revision then 'stale' else coalesce(v.decision,'draft') end as status
 from latest_runs r join periods p on p.id=r.period_id
 cross join lateral jsonb_to_recordset(r.results) as x(service text,unit text,amount_cents text,weight text,driver_basis text)
 left join latest_reviews v on v.run_id=r.id;
create or replace view budget_variance as
 select p.name as period,p.currency,u.name as unit,round(b.amount_cents::numeric/100,2) as budget,
 case when r.id is null then null else round(coalesce(a.cents,0)/100,2) end as allocated,
 case when r.id is null or b.id is null then null else round((coalesce(a.cents,0)-b.amount_cents)/100,2) end as variance,
 case when r.id is null then 'not run' when r.revision<>p.revision then 'stale' else coalesce(v.decision,'draft') end as status
 from periods p cross join units u left join budgets b on b.period_id=p.id and b.unit_id=u.id
 left join latest_runs r on r.period_id=p.id left join latest_reviews v on v.run_id=r.id
 left join lateral(select sum((x->>'amount_cents')::numeric) as cents from jsonb_array_elements(r.results) x where x->>'unit_id'=u.id::text) a on true;
create or replace view allocation_exceptions as
 select p.name as period,s.name as service,count(c.id) as source_rows,round(sum(c.amount_cents)::numeric/100,2) as cost,
 p.currency,'No positive driver weights' as issue
 from costs c join periods p on p.id=c.period_id join services s on s.id=c.service_id
 where not exists(select 1 from drivers d where d.period_id=c.period_id and d.service_id=c.service_id and d.weight>0)
 group by p.id,s.id;
