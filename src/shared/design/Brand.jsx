import React from 'react';
import logo from '../../assets/images/logo.png';
export default function Brand({inverse=false}) {
 return <div className={`ox-brand ${inverse?'ox-brand-inverse':''}`}><img src={logo} alt="Thetavega emblem"/><div><span className="ox-wordmark">Operate<span>X</span></span><small>BY THETAVEGA · INDUSTRIAL INTELLIGENCE</small></div></div>;
}
