import {useEffect,useState} from 'react';
export const rowsOf=v=>Array.isArray(v)?v:[];
export const stateOf=r=>String(r.status??r.entry_status??r.new_status??r.result_status??r.status_code??r.event_type??'Unspecified').replaceAll('_',' ');
export const dateOf=r=>r.event_ts??r.changed_at??r.plan_date??r.created_at??r.start_ts??r.updated_at;
export const labelOf=r=>r.plan_no??r.order_no??r.production_order_no??r.unit_serial??r.unit_no??r.barcode_value??r.machine_name??r.process_name??r.rule_code??r.event_type??'Record';
export const numeric=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
export const shortDate=v=>v&&Number.isFinite(new Date(v).getTime())?new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',timeZone:'Asia/Kolkata'}):'Undated';
export const shortTime=v=>v&&Number.isFinite(new Date(v).getTime())?new Date(v).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'}):'—';
export function useReducedMotion(){const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const m=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(m.matches);m.addEventListener('change',update);return()=>m.removeEventListener('change',update)},[]);return reduced;}
export function AnimateNumber({value}){const reduced=useReducedMotion();const [display,setDisplay]=useState(value);useEffect(()=>{if(reduced){setDisplay(value);return}let frame;const from=display,start=performance.now();const tick=now=>{const t=Math.min(1,(now-start)/440);setDisplay(from+(value-from)*(1-Math.pow(1-t,3)));if(t<1)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[value,reduced]);return Math.round(display).toLocaleString('en-IN');}
