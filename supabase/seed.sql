insert into periods(id,name,currency,review_due,retention_until) values
 ('10000000-0000-4000-8000-000000000001','October 2026','NZD',current_date-3,date '2033-10-31'),
 ('10000000-0000-4000-8000-000000000002','September 2026','NZD',current_date-30,date '2033-09-30') on conflict do nothing;
insert into units(id,name,owner) values
 ('20000000-0000-4000-8000-000000000001','Advisory','Morgan'),
 ('20000000-0000-4000-8000-000000000002','Distribution','Riley'),
 ('20000000-0000-4000-8000-000000000003','Operations','Casey') on conflict do nothing;
insert into services(id,name,owner,driver_basis) values
 ('30000000-0000-4000-8000-000000000001','Workplace support','Alex','Active staff'),
 ('30000000-0000-4000-8000-000000000002','Shared hosting','Alex','Measured workload units'),
 ('30000000-0000-4000-8000-000000000003','Archive storage','Jamie','Stored gigabytes') on conflict do nothing;
insert into imports(id,period_id,fingerprint,source_ref,actor,expected_count,expected_cents,raw_headers) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','fictional-demo-october','Fictional October cost report','Alex',4,1560001,'[]') on conflict do nothing;
insert into costs(id,period_id,import_id,service_id,source_id,description,amount_cents,raw) values
 ('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','DEMO-1','Monthly support',900001,'{}'),
 ('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','DEMO-2','Hosting services',600000,'{}'),
 ('50000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','DEMO-3','Hosting credit',-30000,'{}'),
 ('50000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000003','DEMO-4','Archive storage',90000,'{}') on conflict do nothing;
insert into drivers(period_id,service_id,unit_id,weight,evidence,measured_on,actor)
 select p.id,s.id,u.id,case u.name when 'Advisory' then 20 when 'Distribution' then 30 else 10 end,
 'Fictional staffing worksheet',current_date-5,'Alex' from periods p cross join services s cross join units u
 where p.name='October 2026' and s.name='Workplace support' on conflict do nothing;
insert into drivers(period_id,service_id,unit_id,weight,evidence,measured_on,actor)
 select p.id,s.id,u.id,case u.name when 'Advisory' then 2 else 1 end,
 'Fictional workload worksheet',current_date-100,'Alex' from periods p cross join services s cross join units u
 where p.name='October 2026' and s.name='Shared hosting' and u.name<>'Operations' on conflict do nothing;
insert into budgets(period_id,unit_id,amount_cents)
 select p.id,u.id,case u.name when 'Advisory' then 600000 when 'Distribution' then 650000 else 200000 end
 from periods p cross join units u where p.name='October 2026' on conflict do nothing;
