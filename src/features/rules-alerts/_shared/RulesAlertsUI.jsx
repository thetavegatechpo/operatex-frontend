import React, { createContext, useContext, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRulesAlertsApi } from './rulesAlerts.service';
import './RulesAlerts.css';

const Context = createContext(null);
export function RulesAlertsProvider({ children, request, baseURL, can }) {
  const api = useMemo(() => makeRulesAlertsApi({ request, baseURL }), [request, baseURL]);
  // 'can' MUST be the host application's current verified permission resolver.
  // No default allow-all, no hardcoded admin bypass.
  const value = useMemo(() => ({ api, can: typeof can === 'function' ? can : () => false, permissionsWired: typeof can === 'function' }), [api, can]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
// If the host sign-in payload does not include permission codes, verify READ access
// by asking an EXISTING protected backend endpoint. This is not a permission grant:
// the server must authenticate, scope, and authorize the request. No write/approval
// or PLC command permission is inferred from read access.
const readEndpoints = Object.freeze({
  RULE_ENGINE: 'rule', ALERT_ENGINE: 'alert', NOTIFICATION_ENGINE: 'notification',
  INTERLOCK_ENGINE: 'interlock', BYPASS_GOVERNANCE: 'bypass', AUDIT_TRAIL: 'audit',
});
export function useRA(module) {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('RulesAlertsProvider is missing');
  const isExplicit = ctx.permissionsWired;
  const permissionPrefix = `RULES_ALERTS.${module}.`;
  const check = useQuery({
    queryKey: ['rules-alerts', 'server-read-verification', module],
    queryFn: async () => {
      const endpoint = readEndpoints[module];
      if (!endpoint || !ctx.api[endpoint]?.config) throw new Error('Unsupported Rules & Alerts module');
      await ctx.api[endpoint].config(); // GET protected by deployed RBAC middleware
      return true;
    },
    enabled: !isExplicit && !!readEndpoints[module],
    staleTime: 30000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const serverVerifiedRead = !isExplicit && check.isSuccess && check.data === true;
  const readSuffix = module === 'AUDIT_TRAIL' ? 'AUDIT_READ' : 'READ';
  const has = (suffix) => {
    if (isExplicit) return ctx.can(permissionPrefix + suffix) === true;
    return suffix === readSuffix && serverVerifiedRead;
  };
  return {
    ...ctx, has, serverVerifiedRead,
    permissionsWired: isExplicit || serverVerifiedRead,
    permissionCheck: check,
    readPermission: readSuffix,
    permissionSource: isExplicit ? 'session' : serverVerifiedRead ? 'backend' : 'unverified',
  };
}
export function useRows(key, getter, enabled = true) {
  return useQuery({ queryKey: ['rules-alerts', ...key], queryFn: getter, enabled, staleTime: 10000, retry: 1 });
}
export function useAction(setNotice, close) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (fn) => fn(),
    onSuccess: async (value) => {
      if (close) close();
      await qc.invalidateQueries({ queryKey: ['rules-alerts'] });
      const outcomes = [
        ...(Array.isArray(value?.dispatch) ? value.dispatch : []),
        ...(Array.isArray(value?.results) ? value.results : []),
      ];
      const failed = outcomes.some(x => x.status === 'FAILED');
      const warning = value?.warning || (value?.command?.status === 'FAILED' ? 'PLC command failed; physical state remains unverified.' : null);
      setNotice({ type: warning || failed ? 'warning' : 'success', text: warning || (failed ? 'Operation recorded with failed actions/deliveries. Inspect runtime records.' : 'Operation recorded. Verify resulting state and acknowledgements.'), value });
    },
    onError: (e) => setNotice({ type: 'danger', text: err(e) }),
  });
}
export const err = (e) => e?.response?.data?.message || e?.message || 'Request failed';
export const arr = (x) => Array.isArray(x) ? x : Array.isArray(x?.rows) ? x.rows : Array.isArray(x?.items) ? x.items : [];
export const stamp = (v) => v ? new Date(v).toLocaleString('en-IN') : '—';
export const short = (x) => String(x ?? '—').slice(0, 13) + ((String(x ?? '').length > 13) ? '…' : '');
export const uniqueKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const validUuid = (v) => /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v || '');
export function parseObject(text, name = 'JSON') { let value; try { value = JSON.parse(text); } catch { throw new Error(`${name} must contain valid JSON`); } if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(`${name} must be a JSON object`); return value; }
export function Status({ value }) { const s = String(value ?? '—').toUpperCase(); const tone = /^(OK|ACTIVE|MATCHED|ACKNOWLEDGED|APPROVED|RESOLVED|COMPLETED)$/.test(s) ? 'success' : /^(ERROR|FAILED|NOK|BLOCK|CRITICAL|REJECTED|REVOKED|EXPIRED)$/.test(s) ? 'danger' : /^(PENDING|WARNING|QUEUED|SENDING|HIGH|NOT_MATCHED)$/.test(s) ? 'warning' : 'secondary'; return <Badge bg={tone}>{s}</Badge>; }
export function Head({ title, subtitle, actions }) { return <div className="ra-header"><div><div className="ra-eyebrow">OPERATEX / RULES & ALERTS</div><h1>{title}</h1><p>{subtitle}</p></div><div className="ra-header-actions">{actions}</div></div>; }
export function Panel({ title, extra, children, className = '' }) { return <Card className={`ra-card ${className}`}><Card.Body><div className="ra-card-title"><h2>{title}</h2>{extra}</div>{children}</Card.Body></Card>; }
export function Tabs({ value, options, change }) { return <div className="ra-tabs">{options.map(([key, label]) => <Button key={key} variant={value === key ? 'primary' : 'light'} onClick={() => change(key)}>{label}</Button>)}</div>; }
export function Notice({ message, close }) { return message && <Alert variant={message.type || 'info'} dismissible onClose={close} className="ra-notice">{message.text}</Alert>; }
export function Loading({ query }) { if (!query?.isFetching && !query?.isLoading) return null; return <div className="ra-loading"><Spinner animation="border" size="sm"/> Loading…</div>; }
export function QueryError({ query }) { return query?.isError ? <Alert variant="danger">{err(query.error)}</Alert> : null; }
export function Locked({ ctx, permission }) {
  const required = permission || ctx.readPermission || 'READ';
  if (ctx.has(required)) return null;
  if (ctx.permissionCheck?.isPending && !ctx.permissionCheck?.isError) {
    return <Alert variant="info">Verifying access with the OperateX server…</Alert>;
  }
  if (ctx.permissionCheck?.isError) {
    const error = ctx.permissionCheck.error;
    const status = error?.response?.status || error?.status;
    return <Alert variant="warning">{status === 403 ? 'Your account is not authorized to view this module.' : status === 401 ? 'Your session is not authenticated. Please sign in again.' : 'Rules & Alerts access could not be verified: ' + err(error)} The server must authorize access using its configured RBAC rules.</Alert>;
  }
  return <Alert variant="warning">No verified permission for this module. Access is managed by the OperateX backend; do not grant access based on a role label.</Alert>;
}
export function Grid({ rows, columns, search, empty = 'No records found', rowKey, children }) {
  const list = arr(rows).filter(r => !search || Object.values(r).some(x => (typeof x === 'string' || typeof x === 'number') && String(x).toLowerCase().includes(search.toLowerCase())));
  return <div className="table-responsive"><Table hover className="ra-table"><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}{children && <th>Actions</th>}</tr></thead><tbody>{list.map((r,i) => <tr key={String((rowKey && r[rowKey]) || i)}>{columns.map(c => <td key={c.key}>{c.render ? c.render(r) : (r[c.key] ?? '—')}</td>)}{children && <td className="ra-row-actions">{children(r)}</td>}</tr>)}</tbody></Table>{!list.length && <div className="ra-empty">{empty}</div>}</div>;
}
export function Pager({ offset, setOffset, length, limit = 50 }) { return <div className="ra-pager"><span>Rows {length ? offset + 1 : 0}–{offset + length}</span><div><Button size="sm" variant="outline-secondary" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button><Button size="sm" variant="outline-secondary" disabled={length < limit} onClick={() => setOffset(offset + limit)}>Next</Button></div></div>; }
export function Dialog({ title, show, onHide, onConfirm, confirmText = 'Save', pending = false, destructive = false, children, disabled = false, size = 'lg' }) { return <Modal show={show} onHide={() => !pending && onHide()} centered size={size} backdrop="static"><Modal.Header closeButton={!pending}><Modal.Title>{title}</Modal.Title></Modal.Header><Modal.Body>{children}</Modal.Body><Modal.Footer><Button variant="outline-secondary" onClick={onHide} disabled={pending}>Cancel</Button>{onConfirm && <Button variant={destructive ? 'danger' : 'primary'} disabled={pending || disabled} onClick={onConfirm}>{pending ? 'Working…' : confirmText}</Button>}</Modal.Footer></Modal>; }
export function Input({ label, value, change, required = false, hint, type = 'text', disabled = false, min, max, as, rows = 3, placeholder, children }) { return <Form.Group className="ra-field"><Form.Label>{label}{required && ' *'}</Form.Label>{as === 'select' ? <Form.Select value={value ?? ''} onChange={e => change(e.target.value)} disabled={disabled}>{children}</Form.Select> : as === 'textarea' ? <Form.Control as="textarea" rows={rows} value={value ?? ''} onChange={e => change(e.target.value)} placeholder={placeholder} disabled={disabled}/> : <Form.Control type={type} value={value ?? ''} onChange={e => change(e.target.value)} placeholder={placeholder} disabled={disabled} min={min} max={max}/>}{hint && <Form.Text muted>{hint}</Form.Text>}</Form.Group>; }
export function JsonView({ data }) { return <pre className="ra-json">{JSON.stringify(data, null, 2)}</pre>; }
export function Stat({ label, value, tone = '' }) { return <div className={`ra-stat ${tone}`}><div>{label}</div><strong>{value ?? '—'}</strong></div>; }
export function SearchBox({ value, change }) { return <Form.Control className="ra-search" placeholder="Search records…" aria-label="Search records" value={value} onChange={e => change(e.target.value)}/>; }
export function ConditionalAction({ permitted, children, ...props }) { return permitted ? <Button {...props}>{children}</Button> : null; }
export { Alert, Badge, Button, Card, Col, Form, Row };

// Action panel maps only to POST routes that exist in the supplied backend.
// Permission status is not inferred from a username or READ access.
export function PostActions({ moduleName, operations = [], has }) {
  return <Panel title="Available Operations" extra={<span className="ra-post-caption">Authenticated POST API operations</span>}>
    <div className="ra-post-grid">
      {operations.map(item => {
        const allowed = has(item.permission);
        // Creation/request forms can be opened under verified READ access.
        // Backend POST guard remains authoritative for WRITE; no privilege is granted client-side.
        const serverCheckedWrite = item.permission === 'WRITE' && has('READ');
        const canOpen = allowed || serverCheckedWrite;
        return <div className="ra-post-item" key={item.endpoint}>
          <div className="ra-post-item-top"><span className="ra-method">POST</span><code>{item.endpoint}</code></div>
          <strong>{item.label}</strong>
          <p>{item.description}</p>
          <Button size="sm" variant={item.variant || 'outline-primary'} disabled={!canOpen || item.disabled === true} title={!canOpen ? `Requires verified RULES_ALERTS.${moduleName}.${item.permission}` : item.disabled ? (item.disabledReason || 'Backend operation unavailable') : ''} onClick={item.onClick}>{item.button || item.label}</Button>
          {serverCheckedWrite && !allowed && <div className="ra-post-guard">Submission is checked by backend WRITE permission; HTTP 403 means access is not granted.</div>}{!canOpen && <div className="ra-post-guard">Permission required: {item.permission}</div>}
          {item.disabled && item.disabledReason && <div className="ra-post-guard">{item.disabledReason}</div>}
        </div>;
      })}
    </div>
  </Panel>;
}
