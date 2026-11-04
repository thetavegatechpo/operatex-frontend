import React from 'react';
import {Link} from 'react-router-dom';
import {Head,Panel,Locked,Status,useRA,useRows,arr} from './_shared/RulesAlertsUI';
const modules=[
  ['RULE_ENGINE','rule-engine','Rule Engine','Configurable conditions, actions and evaluation history'],
  ['ALERT_ENGINE','alert-engine','Alert Engine','Alert lifecycle, acknowledgement and escalation'],
  ['NOTIFICATION_ENGINE','notification-engine','Notification Engine','Channel configuration, queue and delivery'],
  ['INTERLOCK_ENGINE','interlock-engine','Interlock Engine','Block decisions, blocker review and commands'],
  ['BYPASS_GOVERNANCE','bypass-governance','Bypass Governance','Approved, scoped and expiring exceptions'],
  ['AUDIT_TRAIL','audit-trail','Audit Trail','Tenant-scoped change evidence'],
];
export default function RulesAlertsOverview(){const ctx=useRA('RULE_ENGINE');return <div className="ra-page"><Head title="Rules & Alerts" subtitle="Shared enterprise rule evaluation, alerts, interlocks, bypass governance and audit"/><div className="ra-module-grid">{modules.map(([permission,path,title,description])=>{const readable=ctx.permissionsWired&&ctx.can(`RULES_ALERTS.${permission}.${permission==='AUDIT_TRAIL'?'AUDIT_READ':'READ'}`)===true;return <div key={path} className="ra-module-card"><div className="ra-module-title"><strong>{title}</strong><Status value={readable?'AVAILABLE':'SERVER CHECK REQUIRED'}/></div><p>{description}</p>{readable ? <Link to={`/rules-alerts/${path}`}>Open {title}</Link> : <Link to={`/rules-alerts/${path}`}>Check server access</Link>}</div>})}</div><Panel title="Operational integration notice"><p>These pages use the authenticated OperateX APIs. Actual action dispatch, PLC communication, notification providers and audit schema access depend on the deployed backend host adapters. The frontend does not grant access or bypass physical safety systems.</p></Panel></div>;}
