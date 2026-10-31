import Table from '../../../../shared/components/SmartTable.jsx';

// src/pages/Maintenance/PMStrategy.jsx
// Appearance follows the supplied Availability screen; API semantics follow PM Strategy Phase 1.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner} from 'react-bootstrap';
import { ArrowClockwise, CalendarCheck, ClockHistory, GearFill, Plus, Search, ShieldLock, Wrench } from 'react-bootstrap-icons';
import './PMStrategy.css';
import { pmRequest } from '../api/pmStrategy.service.js';

const nowLocal = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16); };
const initFrequency = () => ({frequency_code:'',trigger_type:'TIME',frequency_value:'30',frequency_unit:'DAY',recurrence_basis:'FIXED_ANCHOR',anchor_ts:nowLocal(),effective_from:nowLocal()});
const initStrategy = () => ({strategy_code:'',strategy_name:'',machine_id:'',activity_template_id:'',frequency_id:'',trigger_type:'TIME',counter_parameter_code:'',initial_counter_value:'',counter_baseline_evidence:'',condition_rule_id:'',effective_from:nowLocal()});
const showDate = (value) => { if(!value) return '—'; const d=new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}); };
const errorMessage = (e) => e?.message || 'Request failed';
const itemList = (d) => Array.isArray(d) ? d : (Array.isArray(d?.rows)?d.rows:(Array.isArray(d?.items)?d.items:[]));
const field = (name, label, value, onChange, extra={}) => <Form.Group className="mb-2"><Form.Label className="pm-label">{label}</Form.Label><Form.Control name={name} value={value} onChange={e=>onChange(name,e.target.value)} {...extra}/></Form.Group>;

export default function PMStrategy({apiBase,token:tokenProp,machines:machinesProp=[],templates:templatesProp=[]}) {
  const [lookups,setLookups]=useState({machines:[],templates:[]});
  const machines=machinesProp.length?machinesProp:lookups.machines;
  const templates=templatesProp.length?templatesProp:lookups.templates;
  const [stats,setStats]=useState(null);
  const [evaluation,setEvaluation]=useState(null);
  const [tab,setTab] = useState('overview');
  const [strategies,setStrategies] = useState([]);
  const [frequencies,setFrequencies] = useState([]);
  const [events,setEvents] = useState([]);
  const [access,setAccess] = useState({});
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [success,setSuccess] = useState('');
  const [search,setSearch] = useState('');
  const [modal,setModal] = useState(null);
  const [revisionOf,setRevisionOf] = useState('');
  const [preview,setPreview] = useState(null);
  const [freq,setFreq] = useState(initFrequency);
  const [strategy,setStrategy] = useState(initStrategy);
  const [machineFilter,setMachineFilter] = useState('');
  const [dateFrom,setDateFrom] = useState('');
  const [dateTo,setDateTo] = useState('');
  const [visibility,setVisibility] = useState('active');
  const [historyOpen,setHistoryOpen] = useState(false);
  const [detailId,setDetailId] = useState('');
  const [page,setPage] = useState(1);
  const [dataReady,setDataReady] = useState(false);
  const [counterSnapshots,setCounterSnapshots]=useState([]);
  const [counterFeedAvailable,setCounterFeedAvailable]=useState(false);

  const request = useCallback((path, options={}) => pmRequest(path, options), []);
  const refresh=useCallback(async()=>{
    setBusy(true);setError('');setDataReady(false);
    try {
      const p=await request('/access');setAccess(p||{});
      const jobs=[];
      if(p?.view){jobs.push(request('/counter-snapshots').then(v=>{setCounterSnapshots(itemList(v));setCounterFeedAvailable(true);}).catch(()=>{setCounterSnapshots([]);setCounterFeedAvailable(false);}),request('/master').then(v=>setStrategies(itemList(v))), request('/config').then(v=>setFrequencies(itemList(v))), request('/lookups').then(v=>setLookups(v||{machines:[],templates:[]})),request('/dashboard').then(v=>setStats(v)));}
      else {setStrategies([]);setFrequencies([]);}
      if(p?.report) jobs.push(request('/runtime').then(v=>setEvents(itemList(v)))); else setEvents([]);
      const results=await Promise.allSettled(jobs);
      const failures=results.filter(r=>r.status==='rejected').map(r=>errorMessage(r.reason));
      if(failures.length)setError(failures.join(' | '));
      setDataReady(failures.length===0);
    } catch(e){setError(errorMessage(e));} finally{setBusy(false);}
  },[request]);
  useEffect(()=>{refresh();},[refresh]);

  const save=async(e)=>{
    e.preventDefault();setBusy(true);setError('');setSuccess('');
    try {
      if(modal==='frequency'){
        if(!(Number(freq.frequency_value)>0)) throw new Error('Frequency must be greater than zero.');
        await request(revisionOf?`/config/${revisionOf}/revisions`:'/config',{method:'POST',body:JSON.stringify({...freq,frequency_value:Number(freq.frequency_value),anchor_ts:new Date(freq.anchor_ts).toISOString(),effective_from:new Date(freq.effective_from).toISOString(),month_day_policy:freq.frequency_unit==='MONTH'?'CLAMP_TO_MONTH_END':null,is_active:false})});
      }else{
        const counter=['RUNTIME','COUNT'].includes(strategy.trigger_type);await request(revisionOf?`/master/${revisionOf}/revisions`:'/master',{method:'POST',body:JSON.stringify({...strategy,frequency_id:strategy.trigger_type==='CONDITION'?null:strategy.frequency_id,condition_rule_id:strategy.trigger_type==='CONDITION'?strategy.condition_rule_id:null,counter_parameter_code:counter?strategy.counter_parameter_code:null,initial_counter_value:counter?Number(strategy.initial_counter_value):null,counter_baseline_evidence:counter?JSON.parse(strategy.counter_baseline_evidence||'{}'):null,effective_from:new Date(strategy.effective_from).toISOString()})});
      }
      setSuccess(`${modal==='frequency'?'Frequency':'Strategy'} draft saved successfully.`);
      setModal(null);setRevisionOf('');setFreq(initFrequency());setStrategy(initStrategy());
      await refresh();
    }catch(err){setError(errorMessage(err));}finally{setBusy(false);}
  };

  const showPreview=async f=>{setError('');setPreview(null);try{setPreview(await request(`/config/${f.frequency_id}/preview?count=8`));}catch(e){setError(errorMessage(e));}};
  const startRevision=(kind,row)=>{setRevisionOf(kind==='frequency'?row.frequency_id:row.strategy_id);if(kind==='frequency')setFreq({frequency_code:row.frequency_code,trigger_type:row.trigger_type,frequency_value:String(row.frequency_value),frequency_unit:row.frequency_unit,recurrence_basis:row.recurrence_basis,anchor_ts:new Date(row.anchor_ts).toISOString().slice(0,16),effective_from:nowLocal(),month_day_policy:row.month_day_policy});else setStrategy({strategy_code:row.strategy_code,strategy_name:row.strategy_name,machine_id:row.machine_id,activity_template_id:row.activity_template_id,frequency_id:row.frequency_id||'',condition_rule_id:row.condition_rule_id||'',trigger_type:row.trigger_type,counter_parameter_code:row.counter_parameter_code||'',initial_counter_value:row.initial_counter_value??'',counter_baseline_evidence:row.counter_baseline_evidence?JSON.stringify(row.counter_baseline_evidence):'',effective_from:nowLocal()});setModal(kind);};
  const switchStatus=async (type,id,active)=>{if(!window.confirm(`${active?'Suspend':'Activate'} ${type} revision?`))return;setError('');setBusy(true);try{await request(`/${type}/${id}/${active?'suspend':'activate'}`,{method:'POST'});setSuccess(`${type} ${active?'suspended':'activated'}`);await refresh();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
  const evaluate=async()=>{if(!window.confirm('Run one calendar due-evaluation now? This writes due-event evidence, not Maintenance Schedule tasks.'))return;setBusy(true);setError('');try{let r=await request('/evaluate/time',{method:'POST',body:JSON.stringify({as_of:new Date().toISOString()})});setEvaluation(r);await refresh();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}};
  const machineName = (id)=>machines.find(m=>String(m.machine_id)===String(id))?.machine_name || id || '—';
  const list = useMemo(()=>{
    const data=tab==='frequency'?frequencies:tab==='due'?events:strategies;
    const q=search.toLowerCase().trim();
    return data.filter(r=>(!q||Object.values(r).some(v=>String(v??'').toLowerCase().includes(q))) && (tab==='due' ? (!machineFilter||String(r.machine_id)===machineFilter) && (!dateFrom||String(r.due_ts||r.due_date||'').slice(0,10)>=dateFrom) && (!dateTo||String(r.due_ts||r.due_date||'').slice(0,10)<=dateTo) : visibility==='all'||(visibility==='active'?r.is_active===true:r.is_active!==true)));
  },[tab,frequencies,events,strategies,search,machineFilter,dateFrom,dateTo,visibility]);
  // Overview is based only on facts that this module actually stores.
  // Due events are schedule evidence, never work-completion or overdue proof.
  const activeStrategies = useMemo(()=>strategies.filter(s=>s.is_active),[strategies]);
  const activeMachines = useMemo(()=>new Set(activeStrategies.map(s=>String(s.machine_id)).filter(Boolean)).size,[activeStrategies]);
  const activeIds = useMemo(()=>new Set(activeStrategies.map(s=>String(s.strategy_id))),[activeStrategies]);
  const visibleEvents = useMemo(()=>events.filter(e=>activeIds.has(String(e.strategy_id))),[events,activeIds]);
  const overviewRows = useMemo(()=>activeStrategies.map(s=>{
    const relevant=visibleEvents.filter(e=>String(e.strategy_id)===String(s.strategy_id));
    const latest=relevant.reduce((acc,e)=>!acc||new Date(e.due_ts||e.due_date)>new Date(acc.due_ts||acc.due_date)?e:acc,null);
    const f=frequencies.find(x=>String(x.frequency_id)===String(s.frequency_id));
    return {...s,frequencyLabel:s.frequency_value?`${s.frequency_value} ${s.frequency_unit||''}`:f?`${f.frequency_value} ${f.frequency_unit}`:'Condition',eventCount:relevant.length,latest};
  }).sort((a,b)=>b.eventCount-a.eventCount),[activeStrategies,visibleEvents,frequencies]);
  const counterByStrategy=useMemo(()=>new Map(counterSnapshots.map(x=>[String(x.strategy_id),x])),[counterSnapshots]);
  const metricFor=(r)=>{
    if(!['RUNTIME','COUNT'].includes(r.trigger_type)) return null;
    const snap=counterByStrategy.get(String(r.strategy_id));
    if(!snap) return {available:false,label:'No counter reading'};
    const value=Number(snap.counter_value),next=Number(snap.next_threshold);
    if(!Number.isFinite(value)||!Number.isFinite(next)) return {available:false,label:'Invalid reading'};
    const interval=Number(r.frequency_value)||Number(frequencies.find(f=>String(f.frequency_id)===String(r.frequency_id))?.frequency_value);
    const remain=Math.max(0,next-value);
    const base=Number(r.initial_counter_value||0);
    const pct=interval>0?Math.max(0,Math.min(100,((value-base)%interval+interval)%interval/interval*100)):0;
    const sampleTime=new Date(snap.sample_ts).getTime();
    const stale=!Number.isFinite(sampleTime)||Date.now()-sampleTime>5*60*1000;
    return {available:true,value,next,remain,pct,stale,unit:r.trigger_type==='RUNTIME'?'h':'cycles',
      label:stale?'Reading stale':(remain<=0?'Threshold reached':(interval>0&&remain/interval<=0.1?'Approaching due':'On track'))};
  };
  const counterFormat=(v,type)=>type==='COUNT'?Math.round(v).toLocaleString('en-IN'):Number(v).toLocaleString('en-IN',{maximumFractionDigits:2});
  const currentStrategiesWithEvents = overviewRows.filter(r=>r.eventCount>0).length;
  const triggerSummary = ['TIME','RUNTIME','COUNT','CONDITION'].map(t=>({trigger:t,count:activeStrategies.filter(s=>s.trigger_type===t).length}));
  const historyRows = useMemo(()=>{
    const activeSelection=historyOpen?events:visibleEvents;
    const q=search.trim().toLowerCase();
    return activeSelection.filter(r=>{
      if(detailId&&String(r.strategy_id)!==String(detailId))return false;
      if(machineFilter&&String(r.machine_id)!==machineFilter)return false;
      const date=r.due_ts||r.due_date||'';
      if(dateFrom&&String(date).slice(0,10)<dateFrom)return false;
      if(dateTo&&String(date).slice(0,10)>dateTo)return false;
      return !q||[r.strategy_code,r.strategy_name,r.occurrence_key,machineName(r.machine_id)].some(v=>String(v||'').toLowerCase().includes(q));
    }).sort((a,b)=>new Date(b.due_ts||b.due_date)-new Date(a.due_ts||a.due_date));
  },[events,visibleEvents,historyOpen,search,detailId,machineFilter,dateFrom,dateTo,machines]);
  const pageSize=12;
  const maxPage=Math.max(1,Math.ceil(historyRows.length/pageSize));
  const historyPage=historyRows.slice((Math.min(page,maxPage)-1)*pageSize,Math.min(page,maxPage)*pageSize);
  const openHistory=(id='')=>{setTab('due');setDetailId(id);setHistoryOpen(false);setPage(1);setSearch('');};
  const canWrite=access.config===true;
  const accessLoaded=Object.keys(access).length>0;
  const openAdd=(kind)=>{setRevisionOf('');setPreview(null);setFreq(initFrequency());setStrategy(initStrategy());setModal(kind);};
  const choose=(name,value)=>setStrategy(s=>({...s,[name]:value}));
  const chooseFreq=(name,value)=>setFreq(s=>({...s,[name]:value}));
  return <>

<div className="pm-page">
    <Card className="pm-card mb-3"><Card.Body><Row className="g-3 align-items-center"><Col lg={8}><h3 className="pm-title">PM Strategy</h3><div className="pm-subtitle">Preventive Maintenance · Frequency rules, machine strategies and due-event evidence</div></Col><Col lg={4} className="text-lg-end"><Button className="pm-btn-outline" disabled={busy} onClick={refresh}><ArrowClockwise className="me-2"/>Refresh</Button></Col></Row></Card.Body></Card>
    <div className="pm-top-actions mb-3"><Button className="pm-btn-primary" disabled={busy||!canWrite} onClick={()=>{setTab('strategy');openAdd('strategy')}}><Plus className="me-1"/>Add PM Strategy</Button><Button className="pm-btn-outline" disabled={busy||!canWrite} onClick={()=>{setTab('frequency');openAdd('frequency')}}><Plus className="me-1"/>Add Frequency Rule</Button></div>
    {accessLoaded&&!canWrite&&<Alert variant="warning">This account has read-only PM Strategy access. Adding configurations requires the <code>maintenance:pm-strategy:config</code> permission in your existing role-permission setup. The buttons are disabled until it is granted.</Alert>}
        {error&&<Alert variant="danger" dismissible onClose={()=>setError('')}>{error}</Alert>}
    {success&&<Alert variant="success" dismissible onClose={()=>setSuccess('')}>{success}</Alert>}
    {!dataReady&&<Alert variant="warning">PM data could not be fully loaded or is still loading. Do not interpret the displayed counts as zero until refresh succeeds.</Alert>}
    <div className="pm-section-switch"><button className={tab==='overview'?'selected':''} onClick={()=>setTab('overview')}>Control Center</button><button className={tab==='strategy'?'selected':''} onClick={()=>setTab('strategy')}>Strategies</button><button className={tab==='frequency'?'selected':''} onClick={()=>setTab('frequency')}>Frequency Rules</button><button className={tab==='due'?'selected':''} onClick={()=>openHistory()}>Event History</button></div>
    {tab==='overview'&&<>
      <div className="pm-control-heading"><div><span>MAINTENANCE INTELLIGENCE</span><h4>PM Control Center</h4><p>Current active machine strategies, with due evidence summarized—not repeated as separate rows.</p></div>{access.execute&&<Button className="pm-btn-outline" disabled={busy} onClick={evaluate}>Evaluate calendar due</Button>}</div>
      <div className="pm-kpi-grid">
        <div className="pm-kpi"><span>Active strategies</span><strong>{dataReady?activeStrategies.length:'—'}</strong><small>Approved active revisions</small></div>
        <div className="pm-kpi"><span>Machines covered</span><strong>{dataReady?activeMachines:'—'}</strong><small>Unique machines with PM rules</small></div>
        <div className="pm-kpi"><span>With recorded due events</span><strong>{dataReady?currentStrategiesWithEvents:'—'}</strong><small>Strategies, not repeated occurrences</small></div>
        <div className="pm-kpi"><span>Active trigger types</span><strong>{dataReady?triggerSummary.filter(t=>t.count>0).length:'—'}</strong><small>Time · Runtime · Count · Condition</small></div>
      </div>
      <div className="pm-command-grid">
        <section className="pm-command-main"><div className="pm-command-title"><div><strong>Machine maintenance radar</strong><small>One record per active strategy · select a row to inspect its evidence</small></div><Badge bg="light" text="dark">{overviewRows.length} active</Badge></div>
          <div className="pm-radar-list">{overviewRows.length===0?<div className="pm-empty">{busy?'Loading...':'No active strategies found.'}</div>:overviewRows.map(r=><button type="button" key={r.strategy_id} className="pm-radar-row" onClick={()=>openHistory(r.strategy_id)}><div className="pm-machine-avatar"><Wrench/></div><div className="pm-radar-description"><strong>{r.strategy_name}</strong><small>{machineName(r.machine_id)} <span>·</span> {r.trigger_type} <span>·</span> {r.frequencyLabel}</small></div>{['COUNT','RUNTIME'].includes(r.trigger_type) ? <div className="pm-counter-compact">{(()=>{const m=metricFor(r);return !m.available?<div className="pm-counter-unavailable"><span>—</span><small>{m.label}</small></div>:<><div className="pm-counter-numbers"><span><small>Current</small><strong>{counterFormat(m.value,r.trigger_type)}</strong></span><span><small>Next due</small><strong>{counterFormat(m.next,r.trigger_type)}</strong></span><span><small>Remaining</small><strong>{counterFormat(m.remain,r.trigger_type)} {m.unit}</strong></span></div><div className="pm-counter-meter"><span style={{width:`${m.pct}%`}}/></div><small className={m.stale?'pm-counter-status stale':'pm-counter-status'}>{m.label} · {showDate(counterByStrategy.get(String(r.strategy_id))?.sample_ts)}</small></>;})()}</div>:<div className="pm-evidence-col"><strong>{r.eventCount} <small>events</small></strong><small>{r.latest?`Latest ${showDate(r.latest.due_ts||r.latest.due_date)}`:'No due event recorded'}</small></div>}<span className="pm-radar-next">Evidence →</span></button>)}</div>
          <div className="pm-radar-note">Recorded due events do not establish Pending, Completed, or Overdue work-order status. That requires Maintenance Schedule execution data.</div>
        </section>
        <aside className="pm-command-aside"><div className="pm-command-title"><div><strong>Trigger coverage</strong><small>Active strategies only</small></div><GearFill/></div><div className="pm-trigger-stack">{triggerSummary.map(t=><div className="pm-trigger-row" key={t.trigger}><div><span>{t.trigger}</span><strong>{t.count}</strong></div><div className="pm-trigger-track"><div style={{width:`${activeStrategies.length?t.count/activeStrategies.length*100:0}%`}}/></div></div>)}</div><div className="pm-info-footer"><ShieldLock/> Inactive and superseded revisions are excluded from this control center.</div></aside>
      </div>
      {evaluation&&<Alert variant="info" className="mt-3">Calendar evaluation: {evaluation.generated} new records; {evaluation.skipped?.length||0} skipped. This is not a maintenance completion.</Alert>}
    </>}
    {['strategy','frequency'].includes(tab)&&<Card className="pm-card"><Card.Body>
      <div className="pm-table-title"><div><h5>{tab==='strategy'?'Strategy Configuration':'Frequency Rules'}</h5><small>Active revisions first; switch to All to review drafts or suspension.</small></div><Form.Select className="pm-view-filter" value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="active">Active only</option><option value="inactive">Draft / Suspended</option><option value="all">All revisions</option></Form.Select></div>
      <div className="pm-toolbar mb-3"><div className="pm-search"><Search/><Form.Control placeholder="Search configurations..." value={search} onChange={e=>setSearch(e.target.value)}/></div><Button className="pm-btn-primary" disabled={busy||!canWrite} onClick={()=>openAdd(tab==='strategy'?'strategy':'frequency')}><Plus/> Add {tab==='strategy'?'Strategy':'Frequency'}</Button></div>
      <div className="pm-table-wrap"><Table hover responsive className="pm-table"><thead><tr>{(tab==='strategy'?['Code','Strategy','Machine','Trigger','Frequency','Revision','Status','Actions']:['Code','Trigger','Interval','Recurrence','Anchor','Revision','Status','Actions']).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
        {list.length===0?<tr><td className="pm-empty" colSpan={8}>No matching configurations</td></tr>:list.map((r,i)=>tab==='strategy'?<tr key={r.strategy_id||i}><td><b>{r.strategy_code}</b></td><td>{r.strategy_name}</td><td>{machineName(r.machine_id)}</td><td>{r.trigger_type}</td><td>{r.frequency_value?`${r.frequency_value} ${r.frequency_unit||''}`:'—'}</td><td>{r.version_no??'—'}</td><td><Badge bg={r.is_active?'success':'secondary'}>{r.is_active?'Active':'Inactive'}</Badge></td><td>{canWrite&&<div className="d-flex gap-2 flex-wrap"><Button size="sm" variant="outline-secondary" onClick={()=>startRevision('strategy',r)}>Revision</Button><Button size="sm" variant={r.is_active?'outline-danger':'outline-success'} onClick={()=>switchStatus('strategy',r.strategy_id,r.is_active)}>{r.is_active?'Suspend':'Activate'}</Button></div>}</td></tr>:<tr key={r.frequency_id||i}><td><b>{r.frequency_code}</b></td><td>{r.trigger_type}</td><td>{r.frequency_value} {r.frequency_unit}</td><td>{r.recurrence_basis}</td><td>{showDate(r.anchor_ts)}</td><td>{r.version_no??'—'}</td><td><Badge bg={r.is_active?'success':'secondary'}>{r.is_active?'Active':'Inactive'}</Badge></td><td><div className="d-flex gap-2 flex-wrap"><Button size="sm" variant="outline-primary" onClick={()=>showPreview(r)}>Preview</Button>{canWrite&&<><Button size="sm" variant="outline-secondary" onClick={()=>startRevision('frequency',r)}>Revision</Button><Button size="sm" variant={r.is_active?'outline-danger':'outline-success'} onClick={()=>switchStatus('frequency',r.frequency_id,r.is_active)}>{r.is_active?'Suspend':'Activate'}</Button></>}</div></td></tr>)}
      </tbody></Table></div>
      {preview&&tab==='frequency'&&<Alert variant="info"><strong>Calendar preview: {preview.frequency_code}</strong><div className="small">{preview.timezone_basis}</div><div>{preview.occurrences?.map(x=><Badge key={x.ordinal} bg="light" text="dark" className="me-2">#{x.ordinal} · {showDate(x.due_ts)}</Badge>)}</div><Button variant="outline-secondary" size="sm" onClick={()=>setPreview(null)}>Close</Button></Alert>}
    </Card.Body></Card>}
    {tab==='due'&&<Card className="pm-card"><Card.Body>
      <div className="pm-table-title"><div><h5>Due-event evidence</h5><small>Audit history is preserved. Default view shows only events from currently active strategy revisions.</small></div><Form.Check type="switch" id="pm-all-history" label="Include inactive history" checked={historyOpen} onChange={e=>{setHistoryOpen(e.target.checked);setPage(1);}}/></div>
      {detailId&&<div className="pm-selected-filter">Viewing one strategy <Button variant="outline-secondary" size="sm" onClick={()=>{setDetailId('');setPage(1);}}>Clear selection</Button></div>}
      <div className="pm-filters"><Row className="g-2 align-items-end"><Col md={3}><Form.Label>Machine</Form.Label><Form.Select value={machineFilter} onChange={e=>{setMachineFilter(e.target.value);setPage(1);}}><option value="">All machines</option>{machines.map(m=><option key={m.machine_id} value={m.machine_id}>{m.machine_name}</option>)}</Form.Select></Col><Col md={3}><Form.Label>From date</Form.Label><Form.Control type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}}/></Col><Col md={3}><Form.Label>To date</Form.Label><Form.Control type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}}/></Col><Col md={3}><Button variant="outline-secondary" onClick={()=>{setMachineFilter('');setDateFrom('');setDateTo('');setSearch('');setPage(1);}}>Reset filters</Button></Col></Row></div>
      <div className="pm-toolbar mt-3 mb-2"><div className="pm-search"><Search/><Form.Control placeholder="Search due evidence" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div><small>{historyRows.length} matching records · page {Math.min(page,maxPage)} / {maxPage}</small></div>
      <div className="pm-table-wrap"><Table hover responsive className="pm-table"><thead><tr><th>Maintenance strategy</th><th>Machine</th><th>Trigger</th><th>Due date</th><th>Event</th></tr></thead><tbody>{historyPage.length?historyPage.map((r,i)=>{const strategyRef=strategies.find(s=>String(s.strategy_id)===String(r.strategy_id));return <tr key={r.due_event_id||r.occurrence_key||i}><td><strong>{r.strategy_name||strategyRef?.strategy_name||r.strategy_code||'PM strategy'}</strong></td><td>{machineName(r.machine_id)}</td><td><Badge bg="light" text="dark">{strategyRef?.trigger_type||'—'}</Badge></td><td>{showDate(r.due_ts||r.due_date)}</td><td><span className="pm-short-key">#{String(r.occurrence_key||'').split(':').pop()}</span><Button variant="link" size="sm" title="Copy full occurrence key" onClick={()=>navigator.clipboard?.writeText(r.occurrence_key||'')}>Copy ID</Button></td></tr>}):<tr><td colSpan={5} className="pm-empty">No matching due records</td></tr>}</tbody></Table></div>
      <div className="pm-pager"><small>Showing {historyPage.length} of {historyRows.length} loaded matches</small><div><Button size="sm" variant="outline-secondary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Previous</Button><span>{Math.min(page,maxPage)} / {maxPage}</span><Button size="sm" variant="outline-secondary" disabled={page>=maxPage} onClick={()=>setPage(p=>p+1)}>Next</Button></div></div>
      <p className="pm-history-note">Due events are immutable scheduling evidence, not completed maintenance jobs. History here is paged from the records returned by the existing API; backend pagination is recommended for large datasets.</p>
    </Card.Body></Card>}
    <Modal show={!!modal} onHide={()=>!busy&&setModal(null)} centered size="lg" scrollable className="pm-modal"><Form onSubmit={save}><Modal.Header closeButton><Modal.Title>{revisionOf?'Create Draft Revision':modal==='frequency'?'Add Frequency Configuration':'Add PM Strategy'}</Modal.Title></Modal.Header><Modal.Body>
      {modal==='frequency'?<><Alert variant="light" className="pm-context">Create TIME, RUNTIME, or COUNT frequency rules. Runtime/count due calculation requires trusted gateway evidence.</Alert><Row className="g-2"><Col md={6}>{field('frequency_code','Frequency code *',freq.frequency_code,chooseFreq,{required:true,maxLength:60})}</Col><Col md={3}>{field('frequency_value','Every *',freq.frequency_value,chooseFreq,{required:true,type:'number',min:'0.001',step:'0.001'})}</Col><Col md={3}><Form.Label className="pm-label">Unit *</Form.Label><Form.Select value={freq.frequency_unit} onChange={e=>chooseFreq('frequency_unit',e.target.value)}>{(freq.trigger_type==='TIME'?['DAY','WEEK','MONTH']:freq.trigger_type==='RUNTIME'?['HOUR']:['CYCLE']).map(v=><option key={v}>{v}</option>)}</Form.Select></Col><Col md={6}><Form.Label className="pm-label">Trigger type *</Form.Label><Form.Select value={freq.trigger_type} onChange={e=>setFreq(f=>({...f,trigger_type:e.target.value,frequency_unit:e.target.value==='TIME'?'DAY':e.target.value==='RUNTIME'?'HOUR':'CYCLE',frequency_value:'1'}))}>{['TIME','RUNTIME','COUNT'].map(v=><option key={v}>{v}</option>)}</Form.Select></Col><Col md={6}><Form.Label className="pm-label">Recurrence basis *</Form.Label><Form.Select value={freq.recurrence_basis} onChange={e=>chooseFreq('recurrence_basis',e.target.value)}><option value="FIXED_ANCHOR">Fixed anchor</option><option value="LAST_SUCCESS">Last successful maintenance</option></Form.Select></Col><Col md={6}>{field('anchor_ts','Anchor date/time *',freq.anchor_ts,chooseFreq,{type:'datetime-local',required:true})}</Col><Col md={6}>{field('effective_from','Effective from *',freq.effective_from,chooseFreq,{type:'datetime-local',required:true})}</Col></Row></>:<><Alert variant="light" className="pm-context">Create a machine-specific strategy draft. Machine, frequency or condition rule, and template must already exist.</Alert><Row className="g-2"><Col md={6}>{field('strategy_code','Strategy code *',strategy.strategy_code,choose,{required:true,maxLength:60})}</Col><Col md={6}>{field('strategy_name','Strategy name *',strategy.strategy_name,choose,{required:true,maxLength:150})}</Col><Col md={6}><Form.Label className="pm-label">Machine *</Form.Label>{machines.length?<Form.Select value={strategy.machine_id} required onChange={e=>choose('machine_id',e.target.value)}><option value="">Select machine</option>{machines.map(m=><option value={m.machine_id} key={m.machine_id}>{m.machine_name||m.machine_id}</option>)}</Form.Select>:<Form.Control required placeholder="Machine UUID" value={strategy.machine_id} onChange={e=>choose('machine_id',e.target.value)}/>}</Col><Col md={6}><Form.Label className="pm-label">Maintenance checklist template *</Form.Label>{templates.length?<Form.Select value={strategy.activity_template_id} required onChange={e=>choose('activity_template_id',e.target.value)}><option value="">Select template</option>{templates.map(t=><option value={t.activity_template_id} key={t.activity_template_id}>{t.template_name||t.activity_template_id}</option>)}</Form.Select>:<Form.Control required placeholder="Activity template UUID" value={strategy.activity_template_id} onChange={e=>choose('activity_template_id',e.target.value)}/>}</Col><Col md={6}><Form.Label className="pm-label">Trigger *</Form.Label><Form.Select value={strategy.trigger_type} onChange={e=>setStrategy(s=>({...s,trigger_type:e.target.value,frequency_id:'',condition_rule_id:''}))}>{['TIME','RUNTIME','COUNT','CONDITION'].map(v=><option key={v}>{v}</option>)}</Form.Select></Col>{strategy.trigger_type!=='CONDITION'?<Col md={6}><Form.Label className="pm-label">Frequency rule *</Form.Label><Form.Select value={strategy.frequency_id} required onChange={e=>choose('frequency_id',e.target.value)}><option value="">Select frequency</option>{frequencies.filter(f=>f.trigger_type===strategy.trigger_type).map(f=><option value={f.frequency_id} key={f.frequency_id}>{f.frequency_code} · {f.frequency_value} {f.frequency_unit}</option>)}</Form.Select></Col>:<Col md={6}>{field('condition_rule_id','Condition rule UUID *',strategy.condition_rule_id,choose,{required:true})}</Col>}{['RUNTIME','COUNT'].includes(strategy.trigger_type)&&<><Col md={6}>{field('counter_parameter_code','Counter parameter code *',strategy.counter_parameter_code,choose,{required:true})}</Col><Col md={6}>{field('initial_counter_value','Normalized initial counter *',strategy.initial_counter_value,choose,{required:true,type:'number',min:'0',step:'any'})}</Col><Col md={12}>{field('counter_baseline_evidence','Baseline source evidence JSON *',strategy.counter_baseline_evidence,choose,{required:true,placeholder:'{"epoch":"...","source_key":"..."}'})}</Col></>}<Col md={6}>{field('effective_from','Effective from *',strategy.effective_from,choose,{type:'datetime-local',required:true})}</Col></Row></>}
    </Modal.Body><Modal.Footer><Button variant="outline-secondary" onClick={()=>setModal(null)} disabled={busy}>Cancel</Button><Button className="pm-btn-primary" type="submit" disabled={busy}>{busy?'Saving…':'Save Configuration'}</Button></Modal.Footer></Form></Modal>
  </div>
</>;
}
