create table periods (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 currency text not null check(currency ~ '^[A-Z]{3}$'),
 review_due date not null, retention_until date not null,
 revision bigint not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table units (
 id uuid primary key default gen_random_uuid(), name text not null unique, owner text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table services (
 id uuid primary key default gen_random_uuid(), name text not null unique, owner text not null,
 driver_basis text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table imports (
 id uuid primary key default gen_random_uuid(), period_id uuid not null references periods,
 fingerprint text not null, source_ref text not null, actor text not null,
 expected_count integer not null check(expected_count > 0), expected_cents bigint not null,
 raw_headers jsonb not null, unique(period_id,fingerprint),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table costs (
 id uuid primary key default gen_random_uuid(), period_id uuid not null references periods,
 import_id uuid not null references imports, service_id uuid not null references services,
 source_id text not null, description text not null, amount_cents bigint not null check(abs(amount_cents)<=1000000000000),
 raw jsonb not null, unique(period_id,source_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table drivers (
 id uuid primary key default gen_random_uuid(), period_id uuid not null references periods,
 service_id uuid not null references services, unit_id uuid not null references units,
 weight bigint not null check(weight between 0 and 1000000000), evidence text not null,
 measured_on date not null, actor text not null, unique(period_id,service_id,unit_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table budgets (
 id uuid primary key default gen_random_uuid(), period_id uuid not null references periods,
 unit_id uuid not null references units, amount_cents bigint not null check(amount_cents between 0 and 1000000000000),
 unique(period_id,unit_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table runs (
 id uuid primary key default gen_random_uuid(), period_id uuid not null references periods,
 revision bigint not null, actor text not null, purpose text not null,
 snapshot jsonb not null, source_hash text not null, results jsonb not null,
 source_cents bigint not null, allocated_cents bigint not null, unallocated_cents bigint not null,
 check(source_cents=allocated_cents+unallocated_cents),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table reviews (
 id uuid primary key default gen_random_uuid(), run_id uuid not null references runs,
 actor text not null, decision text not null check(decision in ('approved','rejected')),
 conclusion text not null, evidence text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), period_id uuid not null references periods,
 actor text not null, body text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=clock_timestamp(); return new; end $$;
create function bump_period() returns trigger language plpgsql as $$ begin
 update periods set revision=revision+1 where id=coalesce(new.period_id,old.period_id); return coalesce(new,old); end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Evidence is append-only'; end $$;
do $$ declare t text; begin
 foreach t in array array['periods','units','services','imports','costs','drivers','budgets','runs','reviews','notes'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
 foreach t in array array['costs','drivers','budgets'] loop
 execute format('create trigger revision after insert or update or delete on %I for each row execute function bump_period()',t);
 end loop;
 foreach t in array array['imports','costs','runs','reviews','notes'] loop
 execute format('create trigger immutable before update or delete on %I for each row execute function immutable_record()',t);
 end loop;
end $$;
create view latest_runs as select distinct on (period_id) * from runs order by period_id,created_at desc,id desc;
create view latest_reviews as select distinct on (run_id) * from reviews order by run_id,created_at desc,id desc;
create view attention as
 select p.name as period,p.currency,p.review_due,p.revision,r.id as run_id,
 case when r.id is null then 'No allocation run' when r.revision<>p.revision then 'Inputs changed since run'
 when exists(select 1 from jsonb_array_elements(r.results) x where x->>'unit_id' is null) then 'Unallocated services'
 when v.id is null then 'Needs independent review' when v.decision='rejected' then 'Review rejected'
 else 'Reviewed' end as issue,
 coalesce(v.decision,'pending') as decision
 from periods p left join latest_runs r on r.period_id=p.id left join latest_reviews v on v.run_id=r.id;
create view showback as
 select r.id as run_id,p.name as period,p.currency,x.service,x.unit,x.amount_cents::numeric/100 as amount,
 x.weight,x.driver_basis,case when r.revision<>p.revision then 'stale' else coalesce(v.decision,'draft') end as status
 from latest_runs r join periods p on p.id=r.period_id
 cross join lateral jsonb_to_recordset(r.results) as x(service text,unit text,amount_cents text,weight text,driver_basis text)
 left join latest_reviews v on v.run_id=r.id;
create view budget_variance as
 select p.name as period,p.currency,u.name as unit,b.amount_cents::numeric/100 as budget,
 case when r.id is null then null else coalesce(a.cents,0)/100 end as allocated,
 case when r.id is null or b.id is null then null else (coalesce(a.cents,0)-b.amount_cents)/100 end as variance,
 case when r.id is null then 'not run' when r.revision<>p.revision then 'stale' else coalesce(v.decision,'draft') end as status
 from periods p cross join units u left join budgets b on b.period_id=p.id and b.unit_id=u.id
 left join latest_runs r on r.period_id=p.id left join latest_reviews v on v.run_id=r.id
 left join lateral(select sum((x->>'amount_cents')::numeric) as cents from jsonb_array_elements(r.results) x where x->>'unit_id'=u.id::text) a on true;
create view allocation_exceptions as
 select p.name as period,s.name as service,count(c.id) as source_rows,sum(c.amount_cents)::numeric/100 as cost,
 p.currency,'No positive driver weights' as issue
 from costs c join periods p on p.id=c.period_id join services s on s.id=c.service_id
 where not exists(select 1 from drivers d where d.period_id=c.period_id and d.service_id=c.service_id and d.weight>0)
 group by p.id,s.id;
