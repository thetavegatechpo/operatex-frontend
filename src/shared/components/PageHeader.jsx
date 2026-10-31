import React from 'react';
export default function PageHeader({title,subtitle,children}){return <header className="ox-page-header"><div><span className="ox-eyebrow">OPERATEX / WORKSPACE</span><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><div className="ox-page-actions">{children}</div></header>}
