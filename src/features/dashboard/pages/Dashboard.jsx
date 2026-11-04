import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Timer, RefreshCw, Factory, Wrench, Package, Target, Clock3, CirclePause, Gauge, ShieldCheck, Layers3,
  CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Search, Download, Maximize2, Minimize2, RotateCcw,
  Cpu, Info, SlidersHorizontal, TriangleAlert
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import api from '../../../shared/api/client.js';
import AnimatedNumber from '../../../shared/motion/AnimatedNumber.jsx';
import Reveal from '../../../shared/motion/Reveal.jsx';
import './Dashboard.css';

/* ───────── helpers (null-safe: unavailable data renders "—", never an invented 0) ───────── */
const num = v => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const fmtN = v => Math.round(v).toLocaleString('en-IN');
const fmtP = v => `${v.toFixed(1)}%`;
const fmtD = v => `${Math.floor(v / 3600)}h ${String(Math.floor((v % 3600) / 60)).padStart(2, '0')}m`;
const fmt1 = v => v.toFixed(1);
const pad = x => String(x).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => toISO(new Date());
const shiftDay = (iso, delta) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + delta); return toISO(d); };
const clamp = v => Math.max(0, Math.min(100, Number(v) || 0));
const statusKey = s => { const v = String(s || '').toUpperCase(); return v.includes('RUN') ? 'running' : v.includes('IDLE') ? 'idle' : v.includes('MAINT') ? 'maintenance' : (v.includes('DOWN') || v.includes('FAULT')) ? 'down' : 'unknown'; };
const STATUS = {
  running: { label: 'Running', color: 'var(--t-run)' }, idle: { label: 'Idle', color: 'var(--t-idle)' },
  down: { label: 'Down', color: 'var(--t-down)' }, maintenance: { label: 'Maintenance', color: 'var(--t-maint)' },
  unknown: { label: 'Unknown', color: 'var(--t-muted)' }
};
const hourLabel = h => { const d = new Date(h); return Number.isNaN(d.getTime()) ? String(h) : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); };

/* ───────── KPI definitions ───────── */
const GROUPS = [['all', 'All'], ['output', 'Output'], ['efficiency', 'Efficiency'], ['time', 'Time & Upkeep']];
const KPIS = [
  { key: 'production', label: 'Production', icon: Factory, anim: 'bob', tone: 'green', group: 'output', fmt: fmtN, unit: 'Parts', viz: 'spark' },
  { key: 'total_parts_produced', label: 'Total Parts Produced', icon: Package, anim: 'float', tone: 'green', group: 'output', fmt: fmtN, viz: 'bars' },
  { key: 'expected_part_count', label: 'Expected Part Count', icon: Target, anim: 'ping', tone: 'blue', group: 'output', fmt: fmtN, viz: 'none' },
  { key: 'oee', label: 'OEE', icon: Gauge, anim: 'needle', tone: 'green', group: 'efficiency', fmt: fmtP, pct: true, viz: 'ring' },
  { key: 'availability', label: 'Availability', icon: Gauge, anim: 'needle', tone: 'green', group: 'efficiency', fmt: fmtP, pct: true, viz: 'ring' },
  { key: 'performance', label: 'Performance', icon: Activity, anim: 'beat', tone: 'green', group: 'efficiency', fmt: fmtP, pct: true, viz: 'ring' },
  { key: 'quality', label: 'Quality', icon: ShieldCheck, anim: 'shine', tone: 'green', group: 'efficiency', fmt: fmtP, pct: true, viz: 'ring' },
  { key: 'avg_oee', label: 'Avg OEE', icon: Layers3, anim: 'float', tone: 'blue', group: 'efficiency', fmt: fmtP, pct: true, viz: 'ring' },
  { key: 'running_time_seconds', label: 'Running Time', icon: Clock3, anim: 'spin', tone: 'green', group: 'time', fmt: fmtD, viz: 'none' },
  { key: 'downtime_seconds', label: 'Downtime', icon: CirclePause, anim: 'blink', tone: 'red', group: 'time', fmt: fmtD, viz: 'none' },
  { key: 'avg_cycle_time_seconds', label: 'Avg Cycle Time', icon: Timer, anim: 'spin', tone: 'blue', group: 'time', fmt: fmt1, unit: 'sec', viz: 'none' },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench, anim: 'wiggle', tone: 'violet', group: 'time', viz: 'maint' }
];

/* ───────── small visuals ───────── */
function Ring({ value, tone }) {
  const v = clamp(value), r = 22, c = 2 * Math.PI * r;
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 120); return () => clearTimeout(t); }, []);
  return <svg className={`oxd-ring tone-${tone}`} viewBox="0 0 56 56" aria-hidden="true">
    <circle cx="28" cy="28" r={r} className="trk" />
    <circle cx="28" cy="28" r={r} className="val" strokeDasharray={c} strokeDashoffset={go ? c * (1 - v / 100) : c} transform="rotate(-90 28 28)" />
  </svg>;
}
function Spark({ rows, id }) {
  if (!rows.length) return null;
  return <div className="oxd-spark" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
    <defs><linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style={{ stopColor: 'var(--t-run)', stopOpacity: .45 }} /><stop offset="100%" style={{ stopColor: 'var(--t-run)', stopOpacity: 0 }} /></linearGradient></defs>
    <Area type="monotone" dataKey="qty" stroke="var(--t-run)" strokeWidth={2} fill={`url(#sp${id})`} dot={false} isAnimationActive animationDuration={1400} />
  </AreaChart></ResponsiveContainer></div>;
}
function MiniBars({ rows }) {
  const last = rows.slice(-6); const max = Math.max(1, ...last.map(r => r.qty));
  if (!last.length) return null;
  return <div className="oxd-minibars" aria-hidden="true">{last.map((r, i) => <span key={i} style={{ '--h': `${Math.max(12, (r.qty / max) * 100)}%`, '--i': i }} />)}</div>;
}

function KpiCard({ def, value, trend, index }) {
  const Icon = def.icon;
  const isMaint = def.key === 'maintenance';
  const raw = isMaint ? num(value?.open) : num(value);
  const available = raw != null;
  const caption = !available ? 'Not available' : isMaint ? `${value.in_progress ?? '—'} in progress · ${value.completed ?? '—'} completed` : 'Live selected-period data';
  return <Reveal className={`oxd-kpi tone-${def.tone} ${available ? '' : 'is-empty'}`} delay={Math.min(index, 8) * 55}>
    <span className={`oxd-ico anim-${def.anim}`}><Icon size={21} /></span>
    <div className="oxd-kpi-copy">
      <span className="oxd-kpi-label">{def.label}</span>
      <strong><AnimatedNumber value={raw} format={isMaint ? fmtN : def.fmt} />{available && def.unit && <small>{def.unit}</small>}{isMaint && available && <small>Open</small>}</strong>
      <span className="oxd-kpi-cap">{caption}</span>
    </div>
    <div className="oxd-kpi-viz">
      {available && def.viz === 'ring' && <Ring value={raw} tone={def.tone} />}
      {available && def.viz === 'spark' && <Spark rows={trend} id={def.key} />}
      {available && def.viz === 'bars' && <MiniBars rows={trend} />}
    </div>
    <i className="oxd-kpi-glow" />
  </Reveal>;
}

function ChartTip({ active, payload, label, unit = 'parts' }) {
  if (!active || !payload?.length) return null;
  return <div className="oxd-tip"><b>{label}</b>{payload.map(p => <div key={p.dataKey}><i style={{ background: p.color || p.stroke }} />{p.name}: <strong>{Number(p.value).toLocaleString('en-IN')} {unit}</strong></div>)}</div>;
}
const Panel = ({ title, hint, right, className = '', delay = 0, children }) => <Reveal as="section" className={`oxd-panel ${className}`} delay={delay}>
  <div className="oxd-panel-top"><div><h2>{title}</h2>{hint && <span className="oxd-muted">{hint}</span>}</div>{right}</div>{children}</Reveal>;
const Empty = ({ icon: I = Info, children }) => <div className="oxd-empty"><I size={22} /><span>{children}</span></div>;

/* ───────── page ───────── */
export default function Dashboard() {
  const [machine, setMachine] = useState('');
  const [date, setDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [group, setGroup] = useState('all');
  const [interval, setIntervalSec] = useState(30);
  const [search, setSearch] = useState('');
  const [trendMode, setTrendMode] = useState('hourly');
  const [full, setFull] = useState(false);

  const query = useQuery({
    queryKey: ['main-dashboard', machine, date],
    queryFn: async () => (await api.get('/main-dashboard/overview', { params: { date, ...(machine ? { machine_id: machine } : {}) } })).data?.data,
    refetchInterval: interval ? interval * 1000 : false, retry: 1
  });
  const data = query.data || {}, metrics = data.metrics || {}, machines = data.machines || [];
  const selected = machines.find(x => x.machine_id === machine);
  const dateText = date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const isToday = date === today();

  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on); return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFull = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch { /* unsupported */ } };

  const trend = useMemo(() => {
    let acc = 0;
    return (data.trend || []).map(r => { const q = Number(r.qty) || 0; acc += q; return { label: hourLabel(r.hour), qty: q, total: acc }; });
  }, [data.trend]);

  const counts = useMemo(() => { const c = { running: 0, idle: 0, down: 0, maintenance: 0, unknown: 0 }; machines.forEach(m => { c[statusKey(m.status)]++; }); return c; }, [machines]);
  const statusPie = Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({ key: k, name: STATUS[k].label, value: v }));
  const listed = machines.filter(m => (statusFilter === 'ALL' || statusKey(m.status) === statusFilter)
    && (!search || `${m.machine_name || ''} ${m.machine_code || ''}`.toLowerCase().includes(search.toLowerCase())));
  const visibleKpis = KPIS.filter(k => group === 'all' || k.group === group);

  const oee = num(metrics.oee), av = num(metrics.availability), pf = num(metrics.performance), ql = num(metrics.quality);
  const radial = [{ name: 'Availability', value: clamp(av), fill: 'var(--t-accent)' }, { name: 'Performance', value: clamp(pf), fill: 'var(--t-accent-2)' }, { name: 'Quality', value: clamp(ql), fill: 'var(--t-signal)' }];
  const hasRadial = [av, pf, ql, oee].some(v => v != null);

  const actual = num(metrics.total_parts_produced), expected = num(metrics.expected_part_count);
  const attain = actual != null && expected ? (actual / expected) * 100 : null;
  const run = num(metrics.running_time_seconds), down = num(metrics.downtime_seconds);
  const timeTotal = (run || 0) + (down || 0);
  const maint = metrics.maintenance || {};
  const maintPie = [['Open', num(maint.open), 'var(--t-idle)'], ['In progress', num(maint.in_progress), 'var(--t-info)'], ['Completed', num(maint.completed), 'var(--t-run)']].filter(([, v]) => v > 0).map(([name, value, fill]) => ({ name, value, fill }));
  const maintTotal = ['open', 'in_progress', 'completed'].reduce((s, k) => s + (num(maint[k]) || 0), 0);

  const reset = () => { setMachine(''); setDate(today()); setStatusFilter('ALL'); setGroup('all'); setSearch(''); };
  const dirty = machine || !isToday || statusFilter !== 'ALL' || group !== 'all' || search;
  const exportCsv = () => {
    const rows = [['Metric', 'Value'], ['Date', date], ['Machine', selected?.machine_name || 'All machines'], ...KPIS.filter(k => k.key !== 'maintenance').map(k => [k.label, metrics[k.key] ?? 'Not available']),
      ['Maintenance open', maint.open ?? 'Not available'], ['Maintenance in progress', maint.in_progress ?? 'Not available'], ['Maintenance completed', maint.completed ?? 'Not available']];
    const blob = new Blob([rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `operatex-dashboard-${date}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  const loading = query.isLoading;
  const updatedText = query.isFetching ? 'Updating…' : data.as_of ? `Last updated ${new Date(data.as_of).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Waiting for live data';

  return <main className="oxd-dashboard">
    {/* ── hero ── */}
    <header className="oxd-hero">
      <div className="oxd-hero-copy">
        <span className="oxd-eyebrow"><Cpu size={13} /> Plant command centre</span>
        <h1>Main Dashboard</h1>
        <p>Production overview and machine-wise live performance</p>
      </div>
      <div className="oxd-hero-side">
        <span className={`oxd-live ${query.isError ? 'bad' : ''}`}><i className="oxd-live-dot" />{query.isError ? 'Connection issue' : updatedText}</span>
        <div className="oxd-hero-actions">
          <button type="button" className="oxd-icon-btn" onClick={exportCsv} title="Export KPIs as CSV" aria-label="Export KPIs as CSV"><Download size={17} /></button>
          <button type="button" className="oxd-icon-btn" onClick={toggleFull} title={full ? 'Exit full screen' : 'Full screen (control-room mode)'} aria-label="Toggle full screen">{full ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
          <button type="button" className={`oxd-icon-btn primary ${query.isFetching ? 'spin' : ''}`} onClick={() => query.refetch()} disabled={query.isFetching} title="Refresh dashboard" aria-label="Refresh dashboard"><RefreshCw size={17} /></button>
        </div>
      </div>
      {interval > 0 && <span className="oxd-refresh-bar" key={`${query.dataUpdatedAt}-${interval}`} style={{ animationDuration: `${interval}s` }} />}
    </header>

    {/* ── filters ── */}
    <section className="oxd-filters" aria-label="Dashboard filters">
      <label className="oxd-field"><span><Factory size={14} />Machine</span>
        <div className="oxd-select"><select aria-label="Machine" value={machine} onChange={e => setMachine(e.target.value)}><option value="">All Machines</option>{machines.map(x => <option key={x.machine_id} value={x.machine_id}>{x.machine_name || x.machine_code}</option>)}</select><ChevronDown size={15} /></div></label>
      <div className="oxd-field"><span><CalendarDays size={14} />Date</span>
        <div className="oxd-datebox">
          <button type="button" onClick={() => setDate(d => shiftDay(d, -1))} aria-label="Previous day"><ChevronLeft size={16} /></button>
          <input aria-label="Date" type="date" value={date} max={today()} onChange={e => e.target.value && setDate(e.target.value)} />
          <button type="button" onClick={() => setDate(d => shiftDay(d, 1))} disabled={isToday} aria-label="Next day"><ChevronRight size={16} /></button>
        </div></div>
      <div className="oxd-field"><span><SlidersHorizontal size={14} />Quick range</span>
        <div className="oxd-seg">{[['Today', 0], ['Yesterday', -1]].map(([l, d]) => <button type="button" key={l} className={date === shiftDay(today(), d) ? 'on' : ''} onClick={() => setDate(shiftDay(today(), d))}>{l}</button>)}</div></div>
      <div className="oxd-field"><span><Activity size={14} />KPI focus</span>
        <div className="oxd-seg">{GROUPS.map(([k, l]) => <button type="button" key={k} className={group === k ? 'on' : ''} onClick={() => setGroup(k)}>{l}</button>)}</div></div>
      <label className="oxd-field"><span><RefreshCw size={14} />Auto-refresh</span>
        <div className="oxd-select sm"><select aria-label="Auto refresh" value={interval} onChange={e => setIntervalSec(Number(e.target.value))}><option value={0}>Off</option><option value={15}>15 sec</option><option value={30}>30 sec</option><option value={60}>1 min</option><option value={300}>5 min</option></select><ChevronDown size={15} /></div></label>
      {dirty && <button type="button" className="oxd-reset" onClick={reset}><RotateCcw size={14} />Reset</button>}
      <span className="oxd-datechip">{dateText}{selected ? ` · ${selected.machine_name || selected.machine_code}` : ''}</span>
    </section>

    {query.isError && <div className="oxd-error" role="alert"><TriangleAlert size={16} />Unable to load dashboard: {query.error?.response?.data?.message || query.error?.message}</div>}

    {/* ── plant health + status ── */}
    <div className="oxd-top">
      <Panel title="Plant Health" hint="Availability × Performance × Quality" className="oxd-health" delay={0}>
        {loading ? <div className="ox-skeleton" style={{ height: 250 }} /> : !hasRadial ? <Empty icon={Gauge}>OEE components are not available for this period</Empty> :
          <div className="oxd-health-body">
            <div className="oxd-radial">
              <ResponsiveContainer width="100%" height="100%"><RadialBarChart data={radial} innerRadius="38%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={13}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} /><RadialBar dataKey="value" cornerRadius={9} background={{ fill: 'var(--t-surface-3)' }} animationDuration={1500} />
              </RadialBarChart></ResponsiveContainer>
              <div className="oxd-radial-center"><small>OEE</small><b><AnimatedNumber value={oee} format={fmtP} duration={1600} /></b></div>
            </div>
            <ul className="oxd-legend">
              {[['Availability', av, 'var(--t-accent)'], ['Performance', pf, 'var(--t-accent-2)'], ['Quality', ql, 'var(--t-signal)']].map(([l, v, c]) => <li key={l}>
                <i style={{ background: c }} /><span>{l}</span><b><AnimatedNumber value={v} format={fmtP} /></b>
                <div className="oxd-bar"><span style={{ width: `${clamp(v)}%`, background: c }} /></div></li>)}
            </ul>
          </div>}
      </Panel>

      <Panel title="Machine Status" hint={`${machines.length} machine${machines.length === 1 ? '' : 's'} · live`} className="oxd-status" delay={90}
        right={<div className="oxd-select sm"><select value={statusFilter} aria-label="Filter machine statuses" onChange={e => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option>{['running', 'idle', 'down', 'maintenance'].map(k => <option key={k} value={k}>{STATUS[k].label}</option>)}</select><ChevronDown size={15} /></div>}>
        <div className="oxd-status-body">
          <div className="oxd-donut">
            {statusPie.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusPie} dataKey="value" innerRadius="64%" outerRadius="94%" paddingAngle={3} cornerRadius={5} stroke="none" animationDuration={1300}>
              {statusPie.map(s => <Cell key={s.key} fill={STATUS[s.key].color} />)}</Pie></PieChart></ResponsiveContainer> : <Empty icon={Cpu}>No machines</Empty>}
            {statusPie.length > 0 && <div className="oxd-donut-center"><b><AnimatedNumber value={machines.length} /></b><small>Machines</small></div>}
          </div>
          <div className="oxd-chips">{[['running', 'Running'], ['idle', 'Idle'], ['down', 'Down'], ['maintenance', 'Maint.']].map(([k, l]) =>
            <button type="button" key={k} className={`${statusFilter === k ? 'on' : ''}`} style={{ '--c': STATUS[k].color }} onClick={() => setStatusFilter(f => f === k ? 'ALL' : k)}><i />{l}<b>{counts[k]}</b></button>)}</div>
        </div>
        <div className="oxd-search"><Search size={14} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a machine…" aria-label="Find a machine" /></div>
        <div className="oxd-status-list">
          {listed.slice(0, 8).map((x, i) => <button type="button" key={x.machine_id} className={machine === x.machine_id ? 'on' : ''} onClick={() => setMachine(x.machine_id)} style={{ '--i': i }}>
            <span><i className={`oxd-dot ${statusKey(x.status)}`} />{x.machine_name || x.machine_code}</span><span className={`oxd-pill ${statusKey(x.status)}`}>{x.status || 'Unknown'}</span></button>)}
          {!listed.length && <Empty icon={Search}>{loading ? 'Loading machines…' : 'No machines match these filters'}</Empty>}
        </div>
      </Panel>
    </div>

    {/* ── KPI grid ── */}
    <section className="oxd-kpis" aria-label="Key performance indicators">
      {loading ? Array.from({ length: 8 }, (_, i) => <div key={i} className="ox-skeleton oxd-kpi-skel" />) :
        visibleKpis.map((def, i) => <KpiCard key={def.key} def={def} value={metrics[def.key]} trend={trend} index={i} />)}
    </section>

    {/* ── charts ── */}
    <div className="oxd-mid">
      <Panel title="Production Trend" hint="Parts produced per hour" delay={0}
        right={<div className="oxd-seg">{[['hourly', 'Hourly'], ['cumulative', 'Cumulative']].map(([k, l]) => <button type="button" key={k} className={trendMode === k ? 'on' : ''} onClick={() => setTrendMode(k)}>{l}</button>)}</div>}>
        {loading ? <div className="ox-skeleton" style={{ height: 290 }} /> : !trend.length ? <Empty icon={Factory}>No production events recorded for this period</Empty> :
          <div className="oxd-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={trend} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}>
            <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" style={{ stopColor: 'var(--t-accent)', stopOpacity: .5 }} /><stop offset="100%" style={{ stopColor: 'var(--t-accent)', stopOpacity: 0 }} /></linearGradient></defs>
            <CartesianGrid stroke="var(--t-chart-grid)" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--t-chart-axis)', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
            <YAxis tick={{ fill: 'var(--t-chart-axis)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--t-accent)', strokeDasharray: '4 4' }} />
            {trendMode === 'hourly'
              ? <Area key="h" type="monotone" dataKey="qty" name="Parts" stroke="var(--t-accent)" strokeWidth={3} fill="url(#trendFill)" dot={{ r: 3.5, strokeWidth: 2, fill: 'var(--t-surface)', stroke: 'var(--t-accent)' }} activeDot={{ r: 6 }} animationDuration={1400} />
              : <Line key="c" type="monotone" dataKey="total" name="Cumulative" stroke="var(--t-signal)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} animationDuration={1400} />}
          </ComposedChart></ResponsiveContainer></div>}
      </Panel>

      <Panel title="Output vs Expected" hint={attain != null ? 'Attainment against plan' : 'Needs a verified plan figure'} delay={90}>
        {actual == null && expected == null ? <Empty icon={Target}>Part counts are not available for this period</Empty> : <>
          <div className="oxd-attain"><b><AnimatedNumber value={attain} format={fmtP} /></b><span>plan attainment</span></div>
          <div className="oxd-chart sm"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Actual', v: actual ?? 0, fill: 'var(--t-run)' }, { name: 'Expected', v: expected ?? 0, fill: 'var(--t-accent)' }]} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--t-chart-grid)" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--t-chart-axis)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--t-chart-axis)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--t-surface-3)', opacity: .5 }} />
            <Bar dataKey="v" name="Parts" radius={[8, 8, 0, 0]} barSize={46} animationDuration={1300}>{[0, 1].map(i => <Cell key={i} fill={i ? 'var(--t-accent)' : 'var(--t-run)'} />)}</Bar>
          </BarChart></ResponsiveContainer></div></>}
      </Panel>
    </div>

    <div className="oxd-bottom">
      <Panel title="Machine Wise Performance" hint={`${machines.length} active machine${machines.length === 1 ? '' : 's'}`} className="oxd-machine" delay={0}>
        <div className="oxd-machine-body">
          <div className="oxd-machine-list">
            <button type="button" className={!machine ? 'on' : ''} onClick={() => setMachine('')}><i className="oxd-dot unknown" />All Machines</button>
            {machines.map(x => <button type="button" key={x.machine_id} className={machine === x.machine_id ? 'on' : ''} onClick={() => setMachine(x.machine_id)}><i className={`oxd-dot ${statusKey(x.status)}`} /><span>{x.machine_name || x.machine_code}</span></button>)}
            {!machines.length && <p className="oxd-muted">No active machines</p>}
          </div>
          <div className="oxd-machine-detail">
            <div className="oxd-machine-head"><h3>{selected?.machine_name || selected?.machine_code || 'All Machines'}</h3><span className={`oxd-pill ${selected ? statusKey(selected.status) : 'unknown'}`}>{selected?.status || 'Overview'}</span></div>
            <p className="oxd-muted">{selected ? 'Selected machine' : 'Factory summary'} · {dateText}</p>
            <div className="oxd-mm">{[['OEE', oee, 'var(--t-accent)'], ['Availability', av, 'var(--t-accent-2)'], ['Performance', pf, 'var(--t-idle)'], ['Quality', ql, 'var(--t-signal)']].map(([l, v, c]) =>
              <div key={l}><small>{l}</small><b><AnimatedNumber value={v} format={fmtP} /></b><div className="oxd-bar"><span style={{ width: `${clamp(v)}%`, background: c }} /></div></div>)}</div>
          </div>
        </div>
      </Panel>

      <Panel title="Running vs Downtime" hint="Time utilisation" delay={80}>
        {run == null && down == null ? <Empty icon={Clock3}>Time data is not available</Empty> : <>
          <div className="oxd-timebar" role="img" aria-label="Running versus downtime">
            <span className="run" style={{ width: `${timeTotal ? (run || 0) / timeTotal * 100 : 0}%` }} />
            <span className="down" style={{ width: `${timeTotal ? (down || 0) / timeTotal * 100 : 0}%` }} />
          </div>
          <div className="oxd-timelegend">
            <div><i style={{ background: 'var(--t-run)' }} /><span>Running</span><b><AnimatedNumber value={run} format={fmtD} /></b></div>
            <div><i style={{ background: 'var(--t-down)' }} /><span>Downtime</span><b><AnimatedNumber value={down} format={fmtD} /></b></div>
            <div><i style={{ background: 'var(--t-info)' }} /><span>Avg cycle</span><b><AnimatedNumber value={num(metrics.avg_cycle_time_seconds)} format={v => `${v.toFixed(1)} sec`} /></b></div>
          </div></>}
        <div className="oxd-note"><Info size={14} />Downtime reason breakdown needs verified source calculations, so it is not estimated here.</div>
      </Panel>

      <Panel title="Maintenance Status" hint="Work orders" right={<Wrench size={17} className="anim-wiggle oxd-panel-ico" />} delay={160}>
        {!maintTotal ? <Empty icon={Wrench}>{metrics.maintenance ? 'No maintenance work orders' : 'Maintenance data not available'}</Empty> :
          <div className="oxd-maint">
            <div className="oxd-maint-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={maintPie} dataKey="value" innerRadius="62%" outerRadius="94%" paddingAngle={4} cornerRadius={5} stroke="none" animationDuration={1300}>{maintPie.map(s => <Cell key={s.name} fill={s.fill} />)}</Pie></PieChart></ResponsiveContainer>
              <div className="oxd-donut-center"><b><AnimatedNumber value={maintTotal} /></b><small>Total</small></div></div>
            <ul className="oxd-legend flat">{[['Open', maint.open, 'var(--t-idle)'], ['In progress', maint.in_progress, 'var(--t-info)'], ['Completed', maint.completed, 'var(--t-run)']].map(([l, v, c]) => <li key={l}><i style={{ background: c }} /><span>{l}</span><b><AnimatedNumber value={num(v)} format={fmtN} /></b></li>)}</ul>
          </div>}
      </Panel>
    </div>

    {data.source_status && Object.values(data.source_status).some(v => v === 'unavailable') && <p className="oxd-footnote"><Info size={13} />Some data sources are unavailable. Their values are shown as — instead of estimated.</p>}
  </main>;
}
