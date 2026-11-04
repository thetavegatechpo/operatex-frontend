# OperateX Rules & Alerts — POST API controls

Updated from the uploaded `rules-alerts (2).zip`. Existing UI and API layer retained.

## POST operations shown

| Module | Verified POST path | UI |
|---|---|---|
| Rule Engine | `/api/rule-engine/config` | Add Rule Configuration form |
| Rule Engine | `/api/rule-engine/evaluate` | Evaluate Event tab |
| Rule Engine | `/api/rule-engine/evaluate-dispatch` | Evaluate & Dispatch confirmation |
| Alert Engine | `/api/alert-engine/runtime` | Raise Alert modal |
| Alert Engine | `/api/alert-engine/runtime/:id/transition` | Alert row actions |
| Alert Engine | `/api/alert-engine/escalations/evaluate` | Escalation modal |
| Notification Engine | `/api/notification-engine/queue` | Queue Notification modal |
| Notification Engine | `/api/notification-engine/dispatch` | Dispatch confirmation |
| Interlock Engine | `/api/interlock-engine/evaluate` | Record BLOCK modal |
| Interlock Engine | `/api/interlock-engine/command` | PLC BLOCK request from an eligible decision row |
| Bypass Governance | `/api/bypass-governance/request` | Request Bypass modal |
| Bypass Governance | `/api/bypass-governance/request/:id/approve` | PENDING row approval/rejection |
| Bypass Governance | `/api/bypass-governance/request/:id/activate` | APPROVED row activation |
| Bypass Governance | `/api/bypass-governance/request/:id/revoke` | Eligible row revocation |
| Bypass Governance | `/api/bypass-governance/expire` | Expiration reconciliation modal |
| Audit Trail | none | Audit is GET/read-only; no POST added |

## Permissions

POST actions require their database-driven backend permission (`WRITE`, `EVALUATE`, `DISPATCH`, `COMMAND`, `APPROVE`, `ACTIVATE`, or `REVOKE`). The shared frontend `RulesAlertsProvider` must receive the host app's verified `can(permissionCode)` resolver. When no verified permission resolver is connected, the existing protected GET read-only fallback does not authorize POST. Buttons in the operation panel remain visible **but disabled**, with the exact required permission displayed. This is intentional and not a frontend bug.

No browser-side role-name or admin bypass is introduced. HTTP 401/403/404/500 statuses remain backend integration issues.

## Backend limitations

- No new `POST /config` endpoints for Alert, Notification, Interlock, Bypass or Audit in the supplied v3 backend: these UIs cannot create their configuration records without new backend routes.
- Audit Trail remains read-only.
- Actual PLC RELEASE has no supported authoritative workflow. BLOCK command requires the correctly configured host gateway and acknowledgement.
- Notification delivery requires a configured worker/provider.
- Bypass activation is NOT PLC release; it requires backend authorization and approval validation.
- Rule dispatch requires a host action adapter.

Only the frontend has been updated. The actual backend and PostgreSQL are unchanged. The JSX has been parsed, but no live API or PLC test has been performed.
