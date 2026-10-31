
import Table from '../../../../shared/components/SmartTable.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner} from 'react-bootstrap';
import { ArrowClockwise, BarChartLine, ClockHistory, Diagram3, Download, PencilSquare, Plus, Search } from 'react-bootstrap-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../../shared/api/client.js';
import lossTree from '../api/lossTree.service.js';
import './LossTree.css';

const SOURCE_TABLES = {
  DOWNTIME:['downtime_event'], BREAKDOWN:['breakdown_event'], PRODUCTION:['production_event'],
  CYCLE_TIME:['cycle_event'], REJECTION:['rejection_event'], QUALITY:['quality_result','rejection_event'],
  PERFORMANCE:['performance_result'], MANUAL:['manual']
};
const GROUPS = ['ROOT','AVAILABILITY','PERFORMANCE','QUALITY','RESOURCE','OTHER'];
const FACTORS = ['NONE','AVAILABILITY','PERFORMANCE','QUALITY'];
const BASIS = ['DURATION','QUANTITY','COUNT','COST'];
const dateOnly = () => { const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const startLocal = date => `${date}T00:00`;
const endLocal = date => { const d=new Date(`${date}T00:00`); d.setDate(d.getDate()+1); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'T00:00'; };
const initialFilters = { company_id:'',plant_id:'',line_id:'',machine_id:'',business_date:'',shift_id:'',from:'',to:'',limit:100,offset:0 };
const savedFilters = () => { try { return { ...initialFilters,...JSON.parse(localStorage.getItem('operatex.loss_tree.filters.v1')||'{}') }; } catch { return initialFilters; } };
const initialCategory = { parent_category_id:'',category_code:'',category_name:'',loss_group:'AVAILABILITY',oee_factor:'AVAILABILITY',is_planned:false,display_order:1,description:'' };
const initialMapping = { loss_category_id:'',plant_id:'',line_id:'',machine_id:'',source_module:'DOWNTIME',source_table:'downtime_event',source_event_type:'',source_reason_code:'',source_status:'',allocation_basis:'DURATION',mapping_condition:'{}',priority_no:100,is_active:true,effective_from:'',effective_to:'' };
const initialIngest = { source_module:'DOWNTIME',source_table:'downtime_event',source_record_id:'',event_start_ts:'',event_end_ts:'',source_event_type:'',source_reason_code:'',source_status:'',duration_sec:'',loss_qty:'',loss_cost:'',idempotency_key:'',evidence:'{}' };
const initialWindow = { window_start_ts:startLocal(dateOnly()),window_end_ts:endLocal(dateOnly()),available_time_sec:'' };
const uid = x => String(x||'');
const fmt = x => x == null || x === '' ? '—' : String(x);
const number = x => Number.isFinite(Number(x)) ? Number(x) : 0;
const time = s => `${(number(s)/60).toLocaleString(undefined,{maximumFractionDigits:1})} min`;
const when = s => s ? new Date(s).toLocaleString() : '—';
const errorText = err => err?.response?.data?.errors?.map(e=>e.message).join('; ') || err?.response?.data?.message || err?.message || 'Request failed';
const parseObject = value => { const parsed=JSON.parse(value||'{}'); if(!parsed || typeof parsed!=='object' || Array.isArray(parsed)) throw new Error('Conditions and evidence must be JSON objects.'); return parsed; };
const localIso = value => value ? new Date(value).toISOString() : null;
const optionName = (row, fields) => fields.map(field=>row[field]).find(Boolean) || row.name || row.id || 'Unnamed';
const rows = value => Array.isArray(value) ? value : Object.values(value||{}).find(Array.isArray)||[];
const useLookup = (key,path) => useQuery({ queryKey:['loss-tree-lookup',key], queryFn:async()=>rows((await api.get(path))?.data?.data),staleTime:300000,retry:1 });
function CsvButton({ data, file }) {
  const download=()=>{
    if(!data.length) return;
    const headings=Array.from(new Set(data.flatMap(row=>Object.keys(row))));
    const quote=v=>'"'+String(v==null?'':typeof v==='object'?JSON.stringify(v):v).replaceAll('"','""')+'"';
    const csv='\uFEFF'+[headings.join(','),...data.map(row=>headings.map(h=>quote(row[h])).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <Button className="loss-outline" onClick={download} disabled={!data.length}><Download/> Export CSV</Button>;
}
function Field({title,children}) {return <Form.Group><Form.Label className="loss-label">{title}</Form.Label>{children}</Form.Group>;}
function ScopeFields({value,onChange,lookups,includeCompany=true}) {
  const companies=lookups.companies, plants=lookups.plants.filter(x=>!value.company_id||uid(x.company_id)===uid(value.company_id));
  const lines=lookups.lines.filter(x=>!value.plant_id||uid(x.plant_id)===uid(value.plant_id));
  const machines=lookups.machines.filter(x=>!value.line_id||uid(x.line_id)===uid(value.line_id));
  const select=(field,items,label,clears=[]) => <Field title={label}><Form.Select value={value[field]||''} onChange={e=>onChange({...value,[field]:e.target.value,...Object.fromEntries(clears.map(k=>[k,'']))})}>
    <option value="">{field==='company_id'?'Select company':'All '+label.toLowerCase()}</option>
    {items.map((x,i)=><option key={x[field]||i} value={x[field]}>{optionName(x,[`${field.slice(0,-3)}_name`,'company_name','plant_name','line_name','machine_name','name','code'])}</option>)}
  </Form.Select></Field>;
  return <Row className="g-3">
    {includeCompany&&<Col lg={3} md={6}>{select('company_id',companies,'Company',['plant_id','line_id','machine_id'])}</Col>}
    <Col lg={3} md={6}>{select('plant_id',plants,'Plant',['line_id','machine_id'])}</Col>
    <Col lg={3} md={6}>{select('line_id',lines,'Line',['machine_id'])}</Col>
    <Col lg={3} md={6}>{select('machine_id',machines,'Machine')}</Col>
  </Row>;
}
function Pill({value}) {const v=String(value||'UNKNOWN').toUpperCase();return <Badge bg={['ACTIVE','FINAL','CLOSED'].includes(v)?'success':['INACTIVE','CANCELLED'].includes(v)?'secondary':'warning'}>{v}</Badge>;}
function CategoryTree({categories,onEdit}) {
  const ordered=[...categories].sort((a,b)=>number(a.display_order)-number(b.display_order)||String(a.category_name).localeCompare(b.category_name));
  const walk=(parent,depth,path)=>ordered.filter(x=>uid(x.parent_category_id)===uid(parent)).flatMap(x=>[
    <div key={x.loss_category_id} className="loss-tree-row" style={{paddingLeft:16+Math.min(depth,9)*22}}>
      <span className={`loss-tree-mark ${String(x.loss_group||'').toLowerCase()}`}/>
      <div><strong>{x.category_name}</strong><small>{x.category_code} · {x.loss_group} · {x.oee_factor}</small></div>
      <span className="loss-tree-spacer"/><Pill value={x.status}/><Button size="sm" variant="link" title="Edit" onClick={()=>onEdit(x)}><PencilSquare/></Button>
    </div>,...(path.has(uid(x.loss_category_id))?[]:walk(x.loss_category_id,depth+1,new Set([...path,uid(x.loss_category_id)])))]);
  const roots=walk(null,0,new Set());
  return <div className="loss-tree-list">{roots.length?roots:<div className="loss-empty">No categories found. Create the root category first.</div>}</div>;
}
export default function LossTree() {
  const qc=useQueryClient();
  const [tab,setTab]=useState('DASHBOARD');const [filters,setFilters]=useState(savedFilters);
  const [message,setMessage]=useState(null);const [search,setSearch]=useState('');
  const [modal,setModal]=useState('');const [category,setCategory]=useState(initialCategory);
  const [mapping,setMapping]=useState(initialMapping);const [ingest,setIngest]=useState(initialIngest);
  const [windowForm,setWindowForm]=useState(initialWindow);const [history,setHistory]=useState(false);
  useEffect(()=>{localStorage.setItem('operatex.loss_tree.filters.v1',JSON.stringify(filters));},[filters]);
  const company=filters.company_id;
  const companyLookup=useLookup('companies','/company-master/master');
  const shiftLookup=useLookup('shifts','/shift-calendar/master');
  const plantLookup=useLookup('plants','/plant-shop-master/master');
  const lineLookup=useLookup('lines','/line-master/master');
  const machineLookup=useLookup('machines','/machine-master/master');
  const lookups=useMemo(()=>({companies:rows(companyLookup.data),plants:rows(plantLookup.data),lines:rows(lineLookup.data),machines:rows(machineLookup.data)}),[companyLookup.data,plantLookup.data,lineLookup.data,machineLookup.data]);
  const base={company_id:company,limit:500};
  const categoriesQ=useQuery({queryKey:['loss-tree','categories',company],queryFn:()=>lossTree.getLossCategories(base),enabled:!!company,refetchInterval:60000});
  const mappingsQ=useQuery({queryKey:['loss-tree','mappings',company],queryFn:()=>lossTree.getLossMappings(base),enabled:!!company,refetchInterval:60000});
  const request=Object.fromEntries(Object.entries({...filters,from:filters.from?localIso(filters.from):'',to:filters.to?localIso(filters.to):''}).filter(([,v])=>v!==''));
  const runtimeQ=useQuery({queryKey:['loss-tree','runtime',request],queryFn:()=>lossTree.getLossRuntime(request),enabled:!!company&&['DASHBOARD','RUNTIME'].includes(tab),refetchInterval:10000});
  const reportQ=useQuery({queryKey:['loss-tree','report',request,history],queryFn:()=>lossTree.getLossReport({...request,history:String(history)}),enabled:!!company&&['DASHBOARD','REPORT'].includes(tab),refetchInterval:30000});
  const categories=rows(categoriesQ.data),mappings=rows(mappingsQ.data),runtime=runtimeQ.data||{};
  const events=rows(runtime.events),summaries=rows(reportQ.data);
  const categoryById=new Map(categories.map(x=>[uid(x.loss_category_id),x]));
  const leaves=summaries.filter(x=>!categories.some(c=>uid(c.parent_category_id)===uid(x.loss_category_id)));
  const duration=leaves.reduce((sum,x)=>sum+number(x.total_duration_sec),0);
  const qty=leaves.reduce((sum,x)=>sum+number(x.total_loss_qty),0);
  const costs=leaves.reduce((sum,x)=>sum+number(x.total_loss_cost),0);
  const byCategory=[...leaves.reduce((map,row)=>{const key=uid(row.loss_category_id);const item=map.get(key)||{key,name:categoryById.get(key)?.category_name||key,seconds:0,qty:0};item.seconds+=number(row.total_duration_sec);item.qty+=number(row.total_loss_qty);map.set(key,item);return map;},new Map()).values()].sort((a,b)=>b.seconds-a.seconds);
  const notify=(error)=>setMessage({type:'danger',text:errorText(error)});
  const invalidate=()=>qc.invalidateQueries({queryKey:['loss-tree']});
  const mutate=useMutation({mutationFn:async({kind,payload})=>{
    if(kind==='category') return category.loss_category_id?lossTree.updateLossCategory(category.loss_category_id,payload):lossTree.createLossCategory(payload);
    if(kind==='mapping') return mapping.loss_mapping_config_id?lossTree.reviseLossMapping({...payload,loss_mapping_config_id:mapping.loss_mapping_config_id}):lossTree.createLossMapping(payload);
    if(kind==='ingest') return lossTree.executeLoss(payload);
    return lossTree.aggregateLossWindow(payload);
  },onSuccess:async(data,variables)=>{await invalidate();setModal('');setMessage({type:'success',text:variables.kind==='ingest'&&data?.duplicate?'Source already classified; existing event returned.':'Saved successfully.'});},onError:notify});
  const saveCategory=e=>{e.preventDefault();if(!company)return notify(new Error('Select a company first.'));
    mutate.mutate({kind:'category',payload:category.loss_category_id?{company_id:company,category_name:category.category_name,description:category.description,display_order:Number(category.display_order),status:category.status}:
      {...category,company_id:company,parent_category_id:category.parent_category_id||null,display_order:Number(category.display_order)}});
  };
  const saveMapping=e=>{e.preventDefault();if(!company)return notify(new Error('Select a company first.'));
    try {mutate.mutate({kind:'mapping',payload:{...mapping,company_id:company,plant_id:mapping.plant_id||null,line_id:mapping.line_id||null,machine_id:mapping.machine_id||null,
      source_event_type:mapping.source_event_type||null,source_reason_code:mapping.source_reason_code||null,source_status:mapping.source_status||null,
      mapping_condition:parseObject(mapping.mapping_condition),priority_no:Number(mapping.priority_no),effective_from:localIso(mapping.effective_from),effective_to:localIso(mapping.effective_to)}});}catch(error){notify(error);}
  };
  const saveIngest=e=>{e.preventDefault();try{
    const data={...ingest,company_id:company,...Object.fromEntries(['plant_id','line_id','machine_id'].map(k=>[k,filters[k]||null])),
      evidence:parseObject(ingest.evidence),source_event_type:ingest.source_event_type||null,source_reason_code:ingest.source_reason_code||null,source_status:ingest.source_status||null};
    if(['downtime_event','breakdown_event'].includes(data.source_table)){
      for(const key of ['event_start_ts','event_end_ts','duration_sec','loss_qty','loss_cost']) delete data[key];
    }else{
      data.event_start_ts=localIso(data.event_start_ts);data.event_end_ts=localIso(data.event_end_ts);
      for(const key of ['duration_sec','loss_qty','loss_cost']) data[key]=data[key]===''?0:Number(data[key]);
    }
    mutate.mutate({kind:'ingest',payload:data});
  }catch(error){notify(error);}};
  const saveWindow=e=>{e.preventDefault();if(Date.parse(windowForm.window_end_ts)<=Date.parse(windowForm.window_start_ts))return notify(new Error('Window end must follow its start.'));mutate.mutate({kind:'aggregate',payload:{company_id:company,plant_id:filters.plant_id||null,line_id:filters.line_id||null,machine_id:filters.machine_id||null,
    business_date:filters.business_date||null,shift_id:filters.shift_id?Number(filters.shift_id):null,window_start_ts:localIso(windowForm.window_start_ts),window_end_ts:localIso(windowForm.window_end_ts),available_time_sec:Number(windowForm.available_time_sec)||0}});};
  const openCategory=row=>{setCategory(row?{...row}:{...initialCategory});setModal('category');};
  const openMapping=row=>{setMapping(row?{...row,mapping_condition:JSON.stringify(row.mapping_condition||{},null,2),effective_from:'',effective_to:''}:{...initialMapping});setModal('mapping');};
  const csv=()=>summaries.map(x=>({window_start_ts:x.window_start_ts,window_end_ts:x.window_end_ts,company_id:x.company_id,plant_id:x.plant_id,line_id:x.line_id,machine_id:x.machine_id,category_code:x.category_code,category_name:x.category_name,loss_event_count:x.loss_event_count,total_duration_sec:x.total_duration_sec,total_loss_qty:x.total_loss_qty,total_loss_cost:x.total_loss_cost,loss_percentage:x.loss_percentage,calculation_status:x.calculation_status,calculation_version:x.calculation_version}));
  return <>

<div className="loss-page">
    <header className="loss-hero"><div><div className="loss-eyebrow">OEE &amp; Loss · Loss Analysis Engine</div><h1>Loss Tree</h1><p>Trace production loss from the OEE factor to the source event.</p></div>
      <div className="loss-hero-actions"><Button className="loss-outline" onClick={invalidate}><ArrowClockwise/> Refresh</Button><Button className="loss-outline" disabled={!company} onClick={()=>setModal('window')}><ClockHistory/> Aggregate Window</Button><Button className="loss-primary" disabled={!company} onClick={()=>{setIngest({...initialIngest});setModal('ingest');}}><Plus/> Classify Event</Button></div></header>
    {message&&<Alert variant={message.type} dismissible onClose={()=>setMessage(null)}>{message.text}</Alert>}
    <section className="loss-filter"><ScopeFields value={filters} onChange={next=>setFilters({...next,shift_id:['company_id','plant_id','line_id'].some(key=>next[key]!==filters[key])?'':filters.shift_id})} lookups={lookups}/><Row className="g-3 mt-0">
      <Col lg={3} md={6}><Field title="Business Date"><Form.Control type="date" value={filters.business_date||''} onChange={e=>setFilters({...filters,business_date:e.target.value})}/></Field></Col>
      <Col lg={3} md={6}><Field title="From"><Form.Control type="datetime-local" value={filters.from||''} onChange={e=>setFilters({...filters,from:e.target.value})}/></Field></Col>
      <Col lg={3} md={6}><Field title="To"><Form.Control type="datetime-local" value={filters.to||''} onChange={e=>setFilters({...filters,to:e.target.value})}/></Field></Col>
      <Col lg={3} md={6} className="d-flex align-items-end"><Button className="loss-outline w-100" onClick={()=>setFilters({...initialFilters,company_id:company})}>Clear filters</Button></Col>
    </Row></section>
    {!company&&<Alert variant="info">Select a company to load its Loss Tree.</Alert>}
    <section className="loss-kpis"><Card><Diagram3/><div><strong>{categories.length}</strong><span>Categories</span></div></Card><Card><BarChartLine/><div><strong>{mappings.filter(x=>x.is_active).length}</strong><span>Active mappings</span></div></Card><Card><ClockHistory/><div><strong>{time(duration)}</strong><span>Leaf loss time</span></div></Card><Card><BarChartLine/><div><strong>{qty.toLocaleString()}</strong><span>Loss quantity</span></div></Card></section>
    <section className="loss-workspace"><nav className="loss-tabs">{[['DASHBOARD','Dashboard'],['CATEGORIES','Category Master'],['MAPPINGS','Mapping Config'],['RUNTIME','Live Runtime'],['REPORT','Report']].map(([key,name])=><button type="button" key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{name}</button>)}</nav>
    {tab==='DASHBOARD'&&<div className="loss-panel"><div className="loss-panel-heading"><h2>Where capacity was lost</h2><span>Latest summary version for each scope and window</span></div>
      {reportQ.isLoading&&<div className="loss-empty"><Spinner size="sm"/> Loading...</div>}
      {!reportQ.isLoading&&<><Row className="g-3"><Col xl={8}><div className="loss-chart"><h3>Top leaf categories by lost time</h3>{byCategory.length?byCategory.slice(0,8).map(x=><div className="loss-bar-row" key={x.key}><span title={x.name}>{x.name}</span><div><i style={{width:`${Math.max(2,x.seconds/(byCategory[0]?.seconds||1)*100)}%`}}/></div><b>{time(x.seconds)}</b></div>):<div className="loss-empty">No summary yet. Aggregate a window to create dashboard data.</div>}</div></Col>
      <Col xl={4}><div className="loss-total"><span>Loss cost</span><strong>{costs.toLocaleString(undefined,{maximumFractionDigits:2})}</strong><p>Cost is shown only when source evidence supplies a loss cost.</p><span>Classified events in current view</span><strong>{events.length}</strong></div></Col></Row></>}
    </div>}
    {tab==='CATEGORIES'&&<div className="loss-panel"><div className="loss-panel-heading"><div><h2>Loss hierarchy</h2><span>Roots, OEE families, and leaf causes</span></div><Button className="loss-primary" disabled={!company} onClick={()=>openCategory()}><Plus/> Add Category</Button></div>{categoriesQ.isLoading?<div className="loss-empty"><Spinner size="sm"/> Loading...</div>:<CategoryTree categories={categories} onEdit={openCategory}/>}</div>}
    {tab==='MAPPINGS'&&<div className="loss-panel"><div className="loss-panel-heading"><div><h2>Source mapping rules</h2><span>Most specific matching rule wins; revisions preserve past event mappings.</span></div><Button className="loss-primary" disabled={!company} onClick={()=>openMapping()}><Plus/> Add Mapping</Button></div>
      <div className="loss-search"><Search/><Form.Control placeholder="Find source, reason or category" value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <Table hover responsive className="loss-table"><thead><tr><th>Source</th><th>Event / reason</th><th>Scope</th><th>Category</th><th>Basis</th><th>Priority</th><th>Status</th><th>Version</th><th/></tr></thead><tbody>
        {mappings.filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase())).map(x=><tr key={x.loss_mapping_config_id}><td><strong>{x.source_module}</strong><small>{x.source_table}</small></td><td>{fmt(x.source_event_type)}<small>{fmt(x.source_reason_code)}</small></td><td>{x.machine_id?'Machine':x.line_id?'Line':x.plant_id?'Plant':'Company'}</td><td>{categoryById.get(uid(x.loss_category_id))?.category_name||x.loss_category_id}</td><td>{x.allocation_basis}</td><td>{x.priority_no}</td><td><Pill value={x.is_active?'ACTIVE':'INACTIVE'}/></td><td>v{x.version_no}</td><td><Button variant="link" title="Create revision" onClick={()=>openMapping(x)}><PencilSquare/></Button></td></tr>)}
        {!mappings.length&&<tr><td colSpan="9" className="loss-empty">No mappings configured.</td></tr>}</tbody></Table></div>}
    {tab==='RUNTIME'&&<div className="loss-panel"><div className="loss-panel-heading"><div><h2>Classified source events</h2><span>Refreshes every 10 seconds; duplicate source IDs return their existing loss event.</span></div><Badge bg="light" text="dark">{events.length} events</Badge></div>
      <Table responsive hover className="loss-table"><thead><tr><th>Started</th><th>Source</th><th>Machine</th><th>Category</th><th>Duration</th><th>Quantity</th><th>Cost</th><th>Status</th></tr></thead><tbody>{events.map(x=><tr key={x.loss_event_id}><td>{when(x.event_start_ts)}</td><td>{x.source_table}<small title={x.source_record_id}>{x.source_record_id}</small></td><td>{fmt(x.machine_id)}</td><td>{categoryById.get(uid(x.loss_category_id))?.category_name||x.loss_category_id}</td><td>{time(x.duration_sec)}</td><td>{number(x.loss_qty).toLocaleString()}</td><td>{number(x.loss_cost).toLocaleString()}</td><td><Pill value={x.event_status}/></td></tr>)}{!events.length&&<tr><td className="loss-empty" colSpan="8">No classified events found.</td></tr>}</tbody></Table></div>}
    {tab==='REPORT'&&<div className="loss-panel"><div className="loss-panel-heading"><div><h2>Loss summary report</h2><span>Parent rows roll up their children; sum leaf rows for total loss.</span></div><div className="loss-hero-actions"><Form.Check type="switch" label="Show versions" checked={history} onChange={e=>setHistory(e.target.checked)}/><CsvButton data={csv()} file={`loss-tree-${dateOnly()}.csv`}/></div></div>
      <Table responsive hover className="loss-table"><thead><tr><th>Window</th><th>Category</th><th>Machine</th><th>Events</th><th>Time</th><th>Quantity</th><th>Cost</th><th>Loss %</th><th>Status</th><th>Version</th></tr></thead><tbody>{summaries.map(x=><tr key={x.loss_summary_id}><td>{when(x.window_start_ts)}<small>to {when(x.window_end_ts)}</small></td><td>{x.category_name||categoryById.get(uid(x.loss_category_id))?.category_name||x.loss_category_id}</td><td>{fmt(x.machine_id)}</td><td>{x.loss_event_count}</td><td>{time(x.total_duration_sec)}</td><td>{number(x.total_loss_qty).toLocaleString()}</td><td>{number(x.total_loss_cost).toLocaleString()}</td><td>{x.loss_percentage==null?'—':`${number(x.loss_percentage).toFixed(2)}%`}</td><td><Pill value={x.calculation_status}/></td><td>v{x.calculation_version}</td></tr>)}{!summaries.length&&<tr><td className="loss-empty" colSpan="10">No summaries for this filter.</td></tr>}</tbody></Table></div>}
    </section>
    <Modal show={modal==='category'} onHide={()=>setModal('')} size="lg" centered><Form onSubmit={saveCategory}><Modal.Header closeButton><Modal.Title>{category.loss_category_id?'Edit Category':'New Loss Category'}</Modal.Title></Modal.Header><Modal.Body><Row className="g-3">
      <Col md={6}><Field title="Code"><Form.Control required disabled={!!category.loss_category_id} value={category.category_code||''} onChange={e=>setCategory({...category,category_code:e.target.value.toUpperCase()})}/></Field></Col>
      <Col md={6}><Field title="Name"><Form.Control required value={category.category_name||''} onChange={e=>setCategory({...category,category_name:e.target.value})}/></Field></Col>
      {!category.loss_category_id&&<><Col md={6}><Field title="Loss group"><Form.Select value={category.loss_group} onChange={e=>setCategory({...category,loss_group:e.target.value,parent_category_id:e.target.value==='ROOT'?'':category.parent_category_id})}>{GROUPS.map(x=><option key={x}>{x}</option>)}</Form.Select></Field></Col>
      <Col md={6}><Field title="Parent"><Form.Select required={category.loss_group!=='ROOT'} disabled={category.loss_group==='ROOT'} value={category.parent_category_id} onChange={e=>setCategory({...category,parent_category_id:e.target.value})}><option value="">{category.loss_group==='ROOT'?'Root category':'Select parent'}</option>{categories.filter(x=>x.status==='ACTIVE'&&number(x.category_level)<10).map(x=><option value={x.loss_category_id} key={x.loss_category_id}>{x.category_name}</option>)}</Form.Select></Field></Col>
      <Col md={6}><Field title="OEE factor"><Form.Select value={category.oee_factor} onChange={e=>setCategory({...category,oee_factor:e.target.value})}>{FACTORS.map(x=><option key={x}>{x}</option>)}</Form.Select></Field></Col></>}
      <Col md={6}><Field title="Display order"><Form.Control type="number" min="1" required value={category.display_order} onChange={e=>setCategory({...category,display_order:e.target.value})}/></Field></Col>
      {!category.loss_category_id?<Col md={6} className="d-flex align-items-end"><Form.Check type="switch" label="Planned loss" checked={!!category.is_planned} onChange={e=>setCategory({...category,is_planned:e.target.checked})}/></Col>:<Col md={6}><Field title="Status"><Form.Select value={category.status} onChange={e=>setCategory({...category,status:e.target.value})}><option>ACTIVE</option><option>INACTIVE</option></Form.Select></Field></Col>}
      <Col md={12}><Field title="Description"><Form.Control as="textarea" rows={2} value={category.description||''} onChange={e=>setCategory({...category,description:e.target.value})}/></Field></Col>
    </Row></Modal.Body><Modal.Footer><Button variant="secondary" onClick={()=>setModal('')}>Cancel</Button><Button type="submit" className="loss-primary" disabled={mutate.isPending}>Save Category</Button></Modal.Footer></Form></Modal>
    <Modal show={modal==='mapping'} onHide={()=>setModal('')} size="xl" centered><Form onSubmit={saveMapping}><Modal.Header closeButton><Modal.Title>{mapping.loss_mapping_config_id?'New Mapping Revision':'New Mapping Rule'}</Modal.Title></Modal.Header><Modal.Body><Row className="g-3">
      <Col md={6}><Field title="Leaf category"><Form.Select required value={mapping.loss_category_id} onChange={e=>setMapping({...mapping,loss_category_id:e.target.value})}><option value="">Select category</option>{categories.filter(x=>x.status==='ACTIVE'&&!categories.some(c=>uid(c.parent_category_id)===uid(x.loss_category_id))).map(x=><option key={x.loss_category_id} value={x.loss_category_id}>{x.category_name}</option>)}</Form.Select></Field></Col>
      <Col md={3}><Field title="Source module"><Form.Select value={mapping.source_module} onChange={e=>setMapping({...mapping,source_module:e.target.value,source_table:SOURCE_TABLES[e.target.value][0]})}>{Object.keys(SOURCE_TABLES).map(x=><option key={x}>{x}</option>)}</Form.Select></Field></Col>
      <Col md={3}><Field title="Source table"><Form.Select value={mapping.source_table} onChange={e=>setMapping({...mapping,source_table:e.target.value})}>{SOURCE_TABLES[mapping.source_module]?.map(x=><option key={x}>{x}</option>)}</Form.Select></Field></Col>
      <Col md={12}><ScopeFields value={{...mapping,company_id:company}} onChange={setMapping} lookups={lookups} includeCompany={false}/></Col>
      <Col md={4}><Field title="Event type"><Form.Control value={mapping.source_event_type||''} onChange={e=>setMapping({...mapping,source_event_type:e.target.value})}/></Field></Col>
      <Col md={4}><Field title="Reason code"><Form.Control value={mapping.source_reason_code||''} onChange={e=>setMapping({...mapping,source_reason_code:e.target.value})}/></Field></Col>
      <Col md={4}><Field title="Source status"><Form.Control value={mapping.source_status||''} onChange={e=>setMapping({...mapping,source_status:e.target.value})}/></Field></Col>
      <Col md={4}><Field title="Allocation basis"><Form.Select value={mapping.allocation_basis} onChange={e=>setMapping({...mapping,allocation_basis:e.target.value})}>{BASIS.map(x=><option key={x}>{x}</option>)}</Form.Select></Field></Col>
      <Col md={4}><Field title="Priority (lower wins)"><Form.Control type="number" min="1" required value={mapping.priority_no} onChange={e=>setMapping({...mapping,priority_no:e.target.value})}/></Field></Col>
      <Col md={4} className="d-flex align-items-end"><Form.Check type="switch" label="Active" checked={!!mapping.is_active} disabled={!!mapping.loss_mapping_config_id} onChange={e=>setMapping({...mapping,is_active:e.target.checked})}/></Col>
      <Col md={6}><Field title="Effective from"><Form.Control type="datetime-local" value={mapping.effective_from||''} onChange={e=>setMapping({...mapping,effective_from:e.target.value})}/></Field></Col>
      <Col md={6}><Field title="Effective to"><Form.Control type="datetime-local" value={mapping.effective_to||''} onChange={e=>setMapping({...mapping,effective_to:e.target.value})}/></Field></Col>
      <Col md={12}><Field title="Evidence conditions (JSON object)"><Form.Control as="textarea" rows={3} spellCheck={false} value={mapping.mapping_condition} onChange={e=>setMapping({...mapping,mapping_condition:e.target.value})}/></Field></Col>
    </Row></Modal.Body><Modal.Footer><Button variant="secondary" onClick={()=>setModal('')}>Cancel</Button><Button type="submit" className="loss-primary" disabled={mutate.isPending}>Save Mapping</Button></Modal.Footer></Form></Modal>
    <Modal show={modal==='ingest'} onHide={()=>setModal('')} size="lg" centered><Form onSubmit={saveIngest}><Modal.Header closeButton><Modal.Title>Classify Source Event</Modal.Title></Modal.Header><Modal.Body><p className="loss-help">Downtime and breakdown IDs are read from their source tables. Other sources must provide normalized evidence.</p><Row className="g-3">
      <Col md={6}><Field title="Source module"><Form.Select value={ingest.source_module} onChange={e=>setIngest({...ingest,source_module:e.target.value,source_table:SOURCE_TABLES[e.target.value][0]})}>{Object.keys(SOURCE_TABLES).map(x=><option key={x}>{x}</option>)}</Form.Select></Field></Col>
      <Col md={6}><Field title="Source table"><Form.Select value={ingest.source_table} onChange={e=>setIngest({...ingest,source_table:e.target.value})}>{SOURCE_TABLES[ingest.source_module]?.map(x=><option key={x}>{x}</option>)}</Form.Select></Field></Col>
      <Col md={12}><Field title="Source record UUID"><Form.Control required value={ingest.source_record_id} onChange={e=>setIngest({...ingest,source_record_id:e.target.value})}/></Field></Col>
      {!['downtime_event','breakdown_event'].includes(ingest.source_table)&&<>
        <Col md={6}><Field title="Started"><Form.Control required type="datetime-local" value={ingest.event_start_ts} onChange={e=>setIngest({...ingest,event_start_ts:e.target.value})}/></Field></Col>
        <Col md={6}><Field title="Ended"><Form.Control type="datetime-local" value={ingest.event_end_ts} onChange={e=>setIngest({...ingest,event_end_ts:e.target.value})}/></Field></Col>
        <Col md={4}><Field title="Loss seconds"><Form.Control type="number" min="0" step="0.001" value={ingest.duration_sec} onChange={e=>setIngest({...ingest,duration_sec:e.target.value})}/></Field></Col>
        <Col md={4}><Field title="Loss quantity"><Form.Control type="number" min="0" step="0.001" value={ingest.loss_qty} onChange={e=>setIngest({...ingest,loss_qty:e.target.value})}/></Field></Col>
        <Col md={4}><Field title="Loss cost"><Form.Control type="number" min="0" step="0.001" value={ingest.loss_cost} onChange={e=>setIngest({...ingest,loss_cost:e.target.value})}/></Field></Col>
      </>}
      <Col md={4}><Field title="Event type"><Form.Control value={ingest.source_event_type} onChange={e=>setIngest({...ingest,source_event_type:e.target.value})}/></Field></Col>
      <Col md={4}><Field title="Reason code"><Form.Control value={ingest.source_reason_code} onChange={e=>setIngest({...ingest,source_reason_code:e.target.value})}/></Field></Col>
      <Col md={4}><Field title="Source status"><Form.Control value={ingest.source_status} onChange={e=>setIngest({...ingest,source_status:e.target.value})}/></Field></Col>
      {ingest.source_module==='MANUAL'&&<Col md={12}><Field title="Idempotency key"><Form.Control required value={ingest.idempotency_key} onChange={e=>setIngest({...ingest,idempotency_key:e.target.value})}/></Field></Col>}
      <Col md={12}><Field title="Evidence JSON"><Form.Control as="textarea" rows={3} value={ingest.evidence} onChange={e=>setIngest({...ingest,evidence:e.target.value})}/></Field></Col>
    </Row></Modal.Body><Modal.Footer><Button variant="secondary" onClick={()=>setModal('')}>Cancel</Button><Button type="submit" className="loss-primary" disabled={mutate.isPending}>Classify</Button></Modal.Footer></Form></Modal>
    <Modal show={modal==='window'} onHide={()=>setModal('')} centered><Form onSubmit={saveWindow}><Modal.Header closeButton><Modal.Title>Aggregate Loss Window</Modal.Title></Modal.Header><Modal.Body><p className="loss-help">Aggregates losses for the selected scope and window. Select a shift below, or use All shifts for a combined summary.</p>
      <div className="mb-3"><Field title="Shift"><Form.Select value={filters.shift_id||''} onChange={e=>setFilters({...filters,shift_id:e.target.value})}><option value="">All shifts</option>{rows(shiftLookup.data).filter(x=>(!filters.company_id||!x.company_id||uid(x.company_id)===uid(filters.company_id))&&(!filters.line_id||!x.line_id||uid(x.line_id)===uid(filters.line_id))).map(x=><option key={x.shift_id} value={x.shift_id}>{x.shift_name||`Shift ${x.shift_id}`}</option>)}</Form.Select></Field></div>
      <Field title="Window start"><Form.Control required type="datetime-local" value={windowForm.window_start_ts} onChange={e=>setWindowForm({...windowForm,window_start_ts:e.target.value})}/></Field>
      <div className="mt-3"><Field title="Window end"><Form.Control required type="datetime-local" value={windowForm.window_end_ts} onChange={e=>setWindowForm({...windowForm,window_end_ts:e.target.value})}/></Field></div>
      <div className="mt-3"><Field title="Available time (seconds, from OEE plan)"><Form.Control type="number" min="0" step="0.001" value={windowForm.available_time_sec} onChange={e=>setWindowForm({...windowForm,available_time_sec:e.target.value})}/></Field></div>
    </Modal.Body><Modal.Footer><Button variant="secondary" onClick={()=>setModal('')}>Cancel</Button><Button type="submit" className="loss-primary" disabled={mutate.isPending}>Aggregate</Button></Modal.Footer></Form></Modal>
  </div>
</>;
}
