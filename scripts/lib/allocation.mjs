import {createHash} from 'node:crypto';
export function cents(value){
 const s=String(value).trim();if(!/^-?\d+(\.\d{1,2})?$/.test(s))throw Error('Amount must be a plain decimal with at most two places');
 const [whole,fraction='']=s.replace(/^-/,'').split('.');const n=(BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0')))*(s.startsWith('-')?-1n:1n);
 if(n>1000000000000n||n< -1000000000000n)throw Error('Amount exceeds supported limit');return n;
}
export const digest=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
export const amount=x=>{const n=BigInt(x);return `${n<0n?'-':''}${(n<0n?-n:n)/100n}.${String((n<0n?-n:n)%100n).padStart(2,'0')}`;};
// Largest remainders conserve every cent. Equal remainders break on stable unit ID.
export function split(total,weights){
 const sign=total<0n?-1n:1n;const magnitude=total*sign;
 const rows=weights.filter(w=>BigInt(w.weight)>0n).map(w=>({...w,weight:String(w.weight)}));
 const denominator=rows.reduce((s,w)=>s+BigInt(w.weight),0n);if(!denominator)return [];
 const shares=rows.map(w=>({...w,cents:magnitude*BigInt(w.weight)/denominator,remainder:magnitude*BigInt(w.weight)%denominator}));
 let left=magnitude-shares.reduce((s,w)=>s+w.cents,0n);
 shares.sort((a,b)=>a.remainder===b.remainder?a.unit_id.localeCompare(b.unit_id):a.remainder>b.remainder?-1:1);
 for(const w of shares){if(left>0n){w.cents++;left--;}}
 return shares.sort((a,b)=>a.unit_id.localeCompare(b.unit_id)).map(({remainder,cents,...w})=>({...w,amount_cents:String(cents*sign)}));
}
export function allocate(snapshot){
 const results=[];let source=0n,allocated=0n,unallocated=0n;
 for(const service of snapshot.services){
  const lines=snapshot.costs.filter(c=>c.service_id===service.id);if(!lines.length)continue;
  const total=lines.reduce((s,c)=>s+BigInt(c.amount_cents),0n);source+=total;
  const weights=snapshot.drivers.filter(d=>d.service_id===service.id);
  const shares=split(total,weights);
  if(!shares.length){unallocated+=total;results.push({service_id:service.id,service:service.name,unit_id:null,unit:'UNALLOCATED',amount_cents:String(total),weight:'0',driver_basis:service.driver_basis});}
  else {allocated+=total;for(const share of shares)results.push({service_id:service.id,service:service.name,...share,driver_basis:service.driver_basis});}
 }
 return {results,source_cents:String(source),allocated_cents:String(allocated),unallocated_cents:String(unallocated)};
}
