import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, UserRound, LockKeyhole, ArrowRight, ScanLine, Workflow, Activity, ShieldCheck, TriangleAlert, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth.service.js';
import { AuthContext } from '../context/AuthContext.jsx';
import Brand from '../../../shared/design/Brand.jsx';
import ThemeToggle from '../../../shared/theme/ThemeToggle.jsx';
import AnimatedNumber from '../../../shared/motion/AnimatedNumber.jsx';
import './login.css';

/* Spur-gear outline: `teeth` trapezoids between inner radius ri and outer radius ro. */
const gearPoints = (cx, cy, teeth, ro, ri) => {
  const step = (Math.PI * 2) / teeth, pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [[0, ri], [.14, ro], [.36, ro], [.5, ri]].forEach(([f, r]) => pts.push(`${(cx + Math.cos(a + f * step) * r).toFixed(1)},${(cy + Math.sin(a + f * step) * r).toFixed(1)}`));
  }
  return pts.join(' ');
};
function Gear({ cx, cy, teeth, ro, ri, dir = 'cw', speed = 14, cls = '' }) {
  const pts = useMemo(() => gearPoints(cx, cy, teeth, ro, ri), [cx, cy, teeth, ro, ri]);
  return <g className={`oxl-gear ${dir} ${cls}`} style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: `${speed}s` }}>
    <polygon points={pts} />
    <circle cx={cx} cy={cy} r={ri * .62} className="cut" />
    {[0, 60, 120].map(a => <line key={a} x1={cx - ri * .62} y1={cy} x2={cx + ri * .62} y2={cy} transform={`rotate(${a} ${cx} ${cy})`} className="spoke" />)}
    <circle cx={cx} cy={cy} r={ri * .18} className="hub" />
  </g>;
}

function FactoryScene() {
  return <svg className="oxl-scene" viewBox="0 0 640 400" role="img" aria-label="Animated illustration of a production line: robot arm, conveyor with scanner, and turning gears">
    <defs>
      <linearGradient id="oxlBelt" x1="0" x2="1"><stop offset="0" stopColor="#25395b" /><stop offset="1" stopColor="#1a2b47" /></linearGradient>
      <linearGradient id="oxlLaser" x1="0" x2="1"><stop offset="0" stopColor="#ff5a36" stopOpacity="0" /><stop offset=".5" stopColor="#ff7a59" /><stop offset="1" stopColor="#ff5a36" stopOpacity="0" /></linearGradient>
      <radialGradient id="oxlSun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#4f8cff" stopOpacity=".35" /><stop offset="1" stopColor="#4f8cff" stopOpacity="0" /></radialGradient>
    </defs>
    <circle cx="470" cy="120" r="170" fill="url(#oxlSun)" />

    {/* skyline */}
    <g className="oxl-skyline">
      <path d="M0 300 V235 H38 V200 H64 V235 H110 L130 205 L150 235 H210 V190 H236 V235 H300 V300Z" />
      <rect x="44" y="150" width="14" height="52" /><rect x="214" y="140" width="14" height="52" />
      {[[22, 252], [74, 250], [96, 262], [170, 255], [188, 266], [250, 252], [270, 268]].map(([x, y], i) => <rect key={i} className="win" style={{ animationDelay: `${i * .7}s` }} x={x} y={y} width="8" height="8" />)}
    </g>
    {/* smoke */}
    {[51, 221].map((x, k) => [0, 1, 2].map(i => <circle key={`${k}${i}`} className="oxl-smoke" cx={x} cy="148" r="8" style={{ animationDelay: `${i * 1.6 + k * .8}s` }} />))}

    {/* gears */}
    <Gear cx={520} cy={112} teeth={14} ro={66} ri={54} speed={22} />
    <Gear cx={425} cy={150} teeth={9} ro={44} ri={35} dir="ccw" speed={14.1} cls="alt" />
    <Gear cx={582} cy={205} teeth={8} ro={34} ri={27} dir="ccw" speed={12.5} />

    {/* conveyor */}
    <g className="oxl-conv">
      <rect x="8" y="318" width="624" height="22" rx="11" fill="url(#oxlBelt)" stroke="#3b5788" />
      <line x1="22" x2="618" y1="329" y2="329" className="belt" />
      {[34, 606].map(x => <g key={x} className="oxl-roller" style={{ transformOrigin: `${x}px 329px` }}><circle cx={x} cy="329" r="15" /><line x1={x - 15} x2={x + 15} y1="329" y2="329" /><line x1={x} x2={x} y1="314" y2="344" /></g>)}
      {[90, 230, 370, 510].map(x => <rect key={x} x={x} y="340" width="10" height="42" className="leg" />)}
    </g>
    {/* parts */}
    {[0, 1, 2, 3, 4].map(i => <g key={i} className="oxl-part" style={{ animationDelay: `${-i * 3.1}s` }}>
      <rect x="0" y="288" width="46" height="30" rx="4" /><rect x="0" y="288" width="46" height="9" rx="4" className="lid" /><path d="M23 288V318" className="tape" /><circle cx="35" cy="308" r="2.6" className="led" style={{ animationDelay: `${i * .4}s` }} />
    </g>)}

    {/* scanner gantry */}
    <g className="oxl-gantry">
      <rect x="296" y="224" width="9" height="96" rx="3" /><rect x="364" y="224" width="9" height="96" rx="3" /><rect x="290" y="212" width="90" height="18" rx="6" />
      <circle cx="335" cy="221" r="3.2" className="led" />
      <rect className="oxl-laser" x="305" y="232" width="59" height="3" fill="url(#oxlLaser)" />
    </g>

    {/* robot arm */}
    <g className="oxl-arm">
      <rect x="95" y="300" width="64" height="20" rx="5" className="base" />
      <rect x="112" y="276" width="30" height="28" rx="6" className="base" />
      <g className="oxl-l1" style={{ transformOrigin: '127px 276px' }}>
        <rect x="119" y="190" width="16" height="92" rx="8" className="link" />
        <circle cx="127" cy="276" r="11" className="joint" />
        <g className="oxl-l2" style={{ transformOrigin: '127px 196px' }}>
          <rect x="119" y="118" width="16" height="84" rx="8" className="link b" />
          <circle cx="127" cy="196" r="9" className="joint" />
          <g className="oxl-grip" style={{ transformOrigin: '127px 120px' }}>
            <rect x="121" y="104" width="12" height="18" rx="3" className="link" />
            <path d="M118 104 L118 92 M136 104 L136 92" className="claw" />
            <g className="oxl-spark"><circle cx="127" cy="86" r="2.4" /><circle cx="119" cy="80" r="1.6" /><circle cx="136" cy="79" r="1.8" /></g>
          </g>
        </g>
      </g>
    </g>
  </svg>;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState(() => { try { return localStorage.getItem('operatex.last_user') || ''; } catch { return ''; } });
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [caps, setCaps] = useState(false);
  const [shake, setShake] = useState(0);
  const [remember, setRemember] = useState(() => { try { return !!localStorage.getItem('operatex.last_user'); } catch { return false; } });
  const [parts, setParts] = useState(12408);

  // Ambient ticker on the hero HUD — decorative only, clearly not tied to the user's data.
  useEffect(() => { const id = setInterval(() => setParts(p => p + 1 + Math.floor(Math.random() * 3)), 1800); return () => clearInterval(id); }, []);

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    try {
      const response = await loginUser(username.trim(), password);
      const session = response?.data?.data;
      if (!session?.token || !session?.user) throw new Error('The server returned an incomplete sign-in response.');
      try { remember ? localStorage.setItem('operatex.last_user', username.trim()) : localStorage.removeItem('operatex.last_user'); } catch { /* ignore */ }
      login(session.token, session.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to sign in. Please try again.');
      setShake(s => s + 1);
    } finally { setLoading(false); }
  }

  return <div className="oxl">
    <section className="oxl-story" aria-hidden="false">
      <div className="oxl-story-bg" />
      <Brand inverse />
      <div className="oxl-copy">
        <span className="oxl-eyebrow"><i />OPERATEX MANUFACTURING SUITE</span>
        <h1>Manufacturing,<br /><em>in focus.</em></h1>
        <p>One workspace for planning, production, quality and traceability. Built by Thetavega.</p>
      </div>

      <div className="oxl-stage">
        <FactoryScene />
        <div className="oxl-hud h1"><small>OEE · SAMPLE</small><b><AnimatedNumber value={87.4} format={v => `${v.toFixed(1)}%`} duration={2200} /></b><span className="bar"><i /></span></div>
        <div className="oxl-hud h2"><small>PARTS · LIVE DEMO</small><b><AnimatedNumber value={parts} duration={900} /></b><span className="tag"><i />RUNNING</span></div>
      </div>

      <ul className="oxl-steps">{[[ScanLine, 'TRACE', '01'], [Workflow, 'EXECUTE', '02'], [Activity, 'IMPROVE', '03']].map(([Icon, label, n], i) =>
        <li key={n} style={{ '--i': i }}><span className="ico"><Icon size={20} /></span><div><small>{n}</small><b>{label}</b></div></li>)}</ul>
      <footer>OPERATEX MES <span>ENGINEERED BY THETAVEGA</span></footer>
    </section>

    <section className="oxl-form">
      <div className="oxl-top"><span>MANUFACTURING EXECUTION SYSTEM</span><div><ThemeToggle /><ShieldCheck size={20} /></div></div>
      <div className="oxl-card" key={shake} data-shake={shake > 0}>
        <span className="oxl-eyebrow dark"><i />WELCOME TO YOUR WORKSPACE</span>
        <h2>Sign in<span>.</span></h2>
        <p className="lead">Use your organization credentials to continue.</p>

        {error && <div className="oxl-alert" role="alert"><TriangleAlert size={17} /><span>{error}</span></div>}

        <form onSubmit={submit} noValidate={false}>
          <label className="oxl-field" htmlFor="ox-username"><span>Username</span>
            <div className="oxl-input"><UserRound size={18} />
              <input id="ox-username" autoComplete="username" autoFocus required maxLength={200} value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" disabled={loading} /></div></label>
          <label className="oxl-field" htmlFor="ox-password"><span>Password</span>
            <div className="oxl-input"><LockKeyhole size={18} />
              <input id="ox-password" autoComplete="current-password" type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                onKeyUp={e => setCaps(e.getModifierState?.('CapsLock') || false)} onBlur={() => setCaps(false)} placeholder="Enter your password" disabled={loading} />
              <button type="button" className="eye" onClick={() => setShow(v => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            {caps && <em className="caps"><TriangleAlert size={13} />Caps Lock is on</em>}</label>
          <label className="oxl-remember"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /><span className="box" />Remember my username on this device</label>

          <button type="submit" className="oxl-submit" disabled={loading}>
            <span className="shine" />
            {loading ? <><Loader2 size={18} className="spin" />Signing in…</> : <>Continue to workspace<ArrowRight size={19} className="arr" /></>}
          </button>
          {loading && <span className="oxl-progress" />}
          <div className="oxl-help"><ShieldCheck size={17} /><span>Access is managed by your organization.<br />For account assistance, contact your administrator.</span></div>
        </form>
      </div>
      <footer>Precision in production. Clarity in every decision.<span>OperateX × Thetavega</span></footer>
    </section>
  </div>;
}
