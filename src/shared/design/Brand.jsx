import React from 'react';
import logo from '../../assets/images/logo.png';
export default function Brand({inverse=false}) {
 return <div className={`ox-brand ${inverse?'ox-brand-inverse':''}`}><img src={logo} alt="Thetavega emblem"/><div><span className="ox-wordmark"><span className="ox-brand-accent">O</span>perate<span className="ox-brand-accent">X</span></span><small>BY THETAVEGA · INDUSTRIAL INTELLIGENCE</small></div></div>;
}
