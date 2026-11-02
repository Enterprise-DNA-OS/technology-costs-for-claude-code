#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
import {allocate,cents,digest,amount} from './lib/allocation.mjs';

export const verbs=['periods','units','services','costs','drivers','imports','runs','run','showback','variance','exceptions','attention','compliance','allocation-preview','allocate','review','add','set-driver','set-budget','log','history','import','export','weekly-review','draft-statement'];
const datasets=['periods','units','services','imports','costs','drivers','budgets','runs','reviews','notes'];
const needed=(o,k)=>{if(o[k]===undefined||o[k]===true||!String(o[k]).trim())throw Error(`Required --${k}`);return String(o[k]).trim();};
const date=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Date must be YYYY-MM-DD');return s;};
const integer=s=>{if(!/^\d+$/.test(s)||!Number.isSafeInteger(Number(s)))throw Error('Expected a nonnegative integer');return Number(s);};
export async function resolve(db,kind,query){
 if(!['periods','services','units','runs'].includes(kind))throw Error('Unknown record type');
 if(!query)throw Error(`Supply ${kind} name or ID`);
 const rows=await db.query(`select * from ${kind} order by id`);
 const exact=rows.filter(r=>r.id===query||r.name?.toLowerCase()===String(query).toLowerCase());
 const found=exact.length?exact:rows.filter(r=>r.id.startsWith(query)||r.name?.toLowerCase().includes(String(query).toLowerCase()));
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No matching'} ${kind}: ${found.map(r=>`${r.id} ${r.name||r.purpose}`).join('; ')||query}`);
 return found[0];
}
export async function snapshot(db,p){
 return {period:{id:p.id,name:p.name,currency:p.currency,revision:String(p.revision)},
 services:await db.query('select id,name,driver_basis from services order by id'),
 costs:await db.query('select id,source_id,service_id,amount_cents::text,import_id from costs where period_id=$1 order by id',[p.id]),
 drivers:await db.query('select d.service_id,d.unit_id,u.name as unit,d.weight::text,d.evidence,d.measured_on from drivers d join units u on u.id=d.unit_id where period_id=$1 order by d.service_id,d.unit_id',[p.id]),
 budgets:await db.query('select unit_id,amount_cents::text from budgets where period_id=$1 order by unit_id',[p.id])};
}
export async function compliance(db){
 const rows=await db.query(`select p.name as period,'SOURCE_CONTROL' as rule,'Import totals do not match source controls' as issue,i.source_ref as evidence
 from imports i join periods p on p.id=i.period_id left join costs c on c.import_id=i.id
 group by i.id,p.name having count(c.id)<>i.expected_count or coalesce(sum(c.amount_cents),0)<>i.expected_cents
 union all select p.name,'DRIVER_AGE','Usage evidence older than 45 days (house policy)',s.name
 from drivers d join periods p on p.id=d.period_id join services s on s.id=d.service_id where d.measured_on<current_date-45
 union all select period,'REVIEW_DUE',issue,'Independent review due '||review_due::text from attention where issue<>'Reviewed' and review_due<current_date
 union all select name,'RETENTION_REVIEW','Retention date reached; do not delete automatically',retention_until::text from periods where retention_until<current_date
 union all select p.name,'SOURCE_REFERENCE','Missing source reference',i.id::text from imports i join periods p on p.id=i.period_id where trim(i.source_ref)=''
 order by period,rule,evidence`);
 return rows;
}
function draft(name,body){const root=process.env.OUTPUT_DIR||REPO_ROOT;const dir=path.join(root,'drafts');mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,`${name}-${Date.now()}-${Math.random().toString(16).slice(2,8)}.md`);writeFileSync(file,body,{flag:'wx',mode:0o600});return [{file,status:'Draft only'}];}
const json=x=>JSON.stringify(x,null,2);
export async function execute(db,args){
 const positional=[],o={};for(const a of args){if(a.startsWith('--')){const at=a.indexOf('=');o[a.slice(2,at<0?undefined:at)]=at<0?true:a.slice(at+1);}else positional.push(a);}
 const [cmd='help',sub]=positional;
 if(cmd==='help')return verbs.map(command=>({command}));
 if(!verbs.includes(cmd))throw Error(`Unknown command ${cmd}`);
 if(cmd==='periods')return db.query('select id,name,currency,review_due,retention_until,revision from periods order by name');
 if(cmd==='units')return db.query('select id,name,owner from units order by name');
 if(cmd==='services')return db.query('select id,name,owner,driver_basis from services order by name');
 if(cmd==='attention')return db.query("select period,currency,review_due,issue,decision from attention order by review_due,period");
 if(cmd==='compliance')return compliance(db);
 if(['showback','variance','exceptions'].includes(cmd)){
  const view={showback:'showback',variance:'budget_variance',exceptions:'allocation_exceptions'}[cmd];
  const where=o.period?' where period=$1':'';const params=o.period?[(await resolve(db,'periods',o.period)).name]:[];
  return db.query(`select * from ${view}${where} order by period,${cmd==='exceptions'?'service':'unit'}`,params);
 }
 if(cmd==='run'){const r=await resolve(db,'runs',sub);return {...r,reviews:await db.query('select actor,decision,conclusion,evidence,created_at from reviews where run_id=$1 order by created_at,id',[r.id])};}
 if(cmd==='export'){
  const file=path.resolve(needed(o,'file'));const out={format:'technology-costs-v1',exported_at:new Date().toISOString()};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of datasets)out[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}
  writeFileSync(file,json(out)+'\n',{flag:'wx',mode:0o600});return [{file,records:datasets.reduce((n,t)=>n+out[t].length,0)}];
 }
 if(cmd==='add'){
  if(sub==='period')return db.query('insert into periods(name,currency,review_due,retention_until) values($1,$2,$3,$4) returning id,name',[needed(o,'name'),needed(o,'currency'),date(needed(o,'due')),date(needed(o,'retain-until'))]);
  if(sub==='unit')return db.query('insert into units(name,owner) values($1,$2) returning id,name',[needed(o,'name'),needed(o,'owner')]);
  if(sub==='service')return db.query('insert into services(name,owner,driver_basis) values($1,$2,$3) returning id,name',[needed(o,'name'),needed(o,'owner'),needed(o,'basis')]);
  throw Error('add period|unit|service');
 }
 if(cmd==='weekly-review'){
  const attention=await execute(db,['attention']);const variance=await execute(db,['variance']);const checks=await compliance(db);
  return draft('weekly-review',`# Technology cost review\n\nDraft. No charges posted or messages sent.\n\n## Period review\n\n${json(attention)}\n\n## Budget variance\n\n${json(variance)}\n\n## Evidence checks\n\n${json(checks)}\n`);
 }
 if(cmd==='review'){
  const actor=needed(o,'actor'),decision=needed(o,'decision');if(!['approved','rejected'].includes(decision))throw Error('Decision must be approved or rejected');
  const r=await resolve(db,'runs',sub);await db.query('select id from periods where id=$1 for update',[r.period_id]);
  const p=(await db.query('select * from periods where id=$1',[r.period_id]))[0];
  if(actor.toLowerCase()===r.actor.trim().toLowerCase())throw Error('Review requires a different person');
  if(decision==='approved'){
   if(String(r.revision)!==String(p.revision)||r.source_hash!==digest(await snapshot(db,p)))throw Error('Inputs changed; allocate again');
   if(r.results.some(x=>x.unit_id===null))throw Error('Resolve unallocated services before approval');
   if(!r.snapshot.costs.length)throw Error('Cannot approve an empty period');
  }
  return db.query('insert into reviews(run_id,actor,decision,conclusion,evidence) values($1,$2,$3,$4,$5) returning id,decision',[r.id,actor,decision,needed(o,'conclusion'),needed(o,'evidence')]);
 }
 const p=await resolve(db,'periods',needed(o,'period'));
 if(['allocate','import','set-driver','set-budget'].includes(cmd)){
  await db.query('select id from periods where id=$1 for update',[p.id]);
  Object.assign(p,(await db.query('select * from periods where id=$1',[p.id]))[0]);
 }
 if(cmd==='costs')return db.query('select c.source_id,s.name as service,c.description,round(c.amount_cents::numeric/100,2) as amount,p.currency from costs c join services s on s.id=c.service_id join periods p on p.id=c.period_id where p.id=$1 order by c.source_id',[p.id]);
 if(cmd==='drivers')return db.query('select s.name as service,u.name as unit,d.weight,d.measured_on,d.evidence from drivers d join services s on s.id=d.service_id join units u on u.id=d.unit_id where period_id=$1 order by s.name,u.name',[p.id]);
 if(cmd==='imports')return db.query('select id,source_ref,expected_count,round(expected_cents::numeric/100,2) as expected_amount,actor,fingerprint from imports where period_id=$1 order by created_at,id',[p.id]);
 if(cmd==='runs')return db.query('select id,actor,purpose,revision,round(source_cents::numeric/100,2) as source_amount,round(allocated_cents::numeric/100,2) as allocated_amount,round(unallocated_cents::numeric/100,2) as unallocated_amount from runs where period_id=$1 order by created_at desc,id desc',[p.id]);
 if(cmd==='history')return db.query('select actor,body,created_at from notes where period_id=$1 order by created_at,id',[p.id]);
 if(cmd==='log')return db.query('insert into notes(period_id,actor,body) values($1,$2,$3) returning id,body',[p.id,needed(o,'actor'),needed(o,'text')]);
 if(cmd==='set-driver'){
  const s=await resolve(db,'services',needed(o,'service')),u=await resolve(db,'units',needed(o,'unit'));
  const measured=date(needed(o,'measured-on'));if(measured>new Date().toISOString().slice(0,10))throw Error('Measurement date cannot be in the future');
  return db.query(`insert into drivers(period_id,service_id,unit_id,weight,evidence,measured_on,actor) values($1,$2,$3,$4,$5,$6,$7)
  on conflict(period_id,service_id,unit_id) do update set weight=excluded.weight,evidence=excluded.evidence,measured_on=excluded.measured_on,actor=excluded.actor returning id,weight`,[p.id,s.id,u.id,integer(needed(o,'weight')),needed(o,'evidence'),measured,needed(o,'actor')]);
 }
 if(cmd==='set-budget'){const u=await resolve(db,'units',needed(o,'unit'));return db.query('insert into budgets(period_id,unit_id,amount_cents) values($1,$2,$3) on conflict(period_id,unit_id) do update set amount_cents=excluded.amount_cents returning id,amount_cents',[p.id,u.id,String(cents(needed(o,'amount')))]);}
 if(cmd==='allocation-preview'||cmd==='allocate'){
  const snap=await snapshot(db,p);if(!snap.costs.length)throw Error('No source costs in this period');const result=allocate(snap);
  if(cmd==='allocation-preview')return result.results.map(x=>({service:x.service,unit:x.unit,amount:amount(x.amount_cents),currency:p.currency,weight:x.weight}));
  const r=await db.query('insert into runs(period_id,revision,actor,purpose,snapshot,source_hash,results,source_cents,allocated_cents,unallocated_cents) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id,source_cents,allocated_cents,unallocated_cents',
  [p.id,p.revision,needed(o,'actor'),needed(o,'purpose'),json(snap),digest(snap),json(result.results),result.source_cents,result.allocated_cents,result.unallocated_cents]);return r;
 }
 if(cmd==='draft-statement'){
  const rows=await execute(db,['showback',`--period=${p.id}`]);const status=await db.query('select issue,decision from attention where period=$1',[p.name]);
  if(!rows.length)throw Error('Allocate this period first');
  return draft('departmental-statement',`# Departmental technology cost statement\n\n${p.name}, ${p.currency}. Draft for review. No invoice or journal is posted.\n\n${json(status)}\n\n${json(rows)}\n`);
 }
 if(cmd==='import'){
  if(sub!=='apptio')throw Error('Use import apptio');
  const bytes=readFileSync(needed(o,'file'),'utf8');const rows=parseCsv(bytes);if(!rows.length)throw Error('Import has no rows');
  const mapping=o.map?JSON.parse(readFileSync(o.map,'utf8')):{source_id:'Source ID',service:'Service',amount:'Amount',currency:'Currency',description:'Description'};
  for(const k of ['source_id','service','amount','currency'])if(!mapping[k]||!Object.keys(rows[0]).some(h=>h.toLowerCase()===mapping[k].toLowerCase()))throw Error(`Missing mapped column ${k}`);
  const parsed=[],seen=new Set();for(const row of rows){
   const id=pick(row,mapping.source_id).trim(),currency=pick(row,mapping.currency).trim();
   if(!id||seen.has(id))throw Error('Missing or duplicate source ID');seen.add(id);
   if(currency!==p.currency)throw Error(`Currency mismatch: expected ${p.currency}`);
   const s=await resolve(db,'services',pick(row,mapping.service));parsed.push({id,service:s.id,cents:cents(pick(row,mapping.amount)),description:pick(row,mapping.description||'Description')||id,raw:row});
  }
  const expected=integer(needed(o,'expected-count')),total=cents(needed(o,'expected-total'));
  if(parsed.length!==expected||parsed.reduce((n,r)=>n+r.cents,0n)!==total)throw Error('Source count or total does not reconcile');
  const fingerprint=digest(bytes);const source=needed(o,'source-ref'),actor=needed(o,'actor');
  const previous=await db.query('select id from imports where period_id=$1 and fingerprint=$2',[p.id,fingerprint]);
  if(previous.length)return [{id:previous[0].id,status:'Already imported',count:expected}];
  const collision=await db.query('select source_id from costs where period_id=$1 and source_id=any($2::text[])',[p.id,parsed.map(r=>r.id)]);
  if(collision.length)throw Error(`Existing source IDs: ${collision.map(r=>r.source_id).join(', ')}. Import only new rows or explicit correction entries.`);
  if(o['dry-run'])return [{status:'Validated only',count:expected,total:amount(total),currency:p.currency}];
  const [batch]=await db.query('insert into imports(period_id,fingerprint,source_ref,actor,expected_count,expected_cents,raw_headers) values($1,$2,$3,$4,$5,$6,$7) returning id',[p.id,fingerprint,source,actor,expected,String(total),json(Object.keys(rows[0]))]);
  for(const r of parsed)await db.query('insert into costs(period_id,import_id,service_id,source_id,description,amount_cents,raw) values($1,$2,$3,$4,$5,$6,$7)',[p.id,batch.id,r.service,r.id,r.description,String(r.cents),json(r.raw)]);
  return [{id:batch.id,status:'Imported',count:expected,total:amount(total),currency:p.currency}];
 }
 throw Error('Command not implemented');
}
export async function transact(db,args){
 if(args[0]==='export')return execute(db,args);
 await db.exec('BEGIN');try{const result=await execute(db,args);await db.exec('COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const args=process.argv.slice(2),result=await transact(db,args);
 if(args.includes('--json')||!Array.isArray(result))console.log(json(result));else console.log(table(result,Object.keys(result[0]||{result:''}).map(key=>({key,label:key}))));
 }catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
