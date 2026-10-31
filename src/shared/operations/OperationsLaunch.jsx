import React from 'react';
import {Radio,ArrowUpRight,ChartNoAxesCombined} from 'lucide-react';
import './operations.css';
export default function OperationsLaunch({onRuntime,onReport}){return <div className="nx-launch"><div><span className="nx-launch-icon"><Radio size={17}/></span><span><b>Explore your operations</b><small>Work visually, then inspect the records.</small></span></div><div><button type="button" onClick={onRuntime}><Radio size={13}/>Open live studio<ArrowUpRight size={13}/></button>{onReport&&<button type="button" className="nx-outline" onClick={onReport}><ChartNoAxesCombined size={13}/>Report explorer</button>}</div></div>}
