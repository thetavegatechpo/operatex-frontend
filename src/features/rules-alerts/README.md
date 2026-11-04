# OperateX Rules & Alerts frontend — Uploaded-structure replacement v2

## Source and scope
- Replaces the six **placeholder** pages in the uploaded `rules-alerts.zip` with operational UI modules.
- Reuses the previous frontend implementation as a starting point and reconciles endpoints with `OperateX_Rules_Alerts_Backend_Enhanced_v3.zip` (actual `.routes.js` and service files inspected).
- Preserves the uploaded structure: `src/rules-alerts/<module>/api/` and `pages/` for all six modules.
- Adds `src/rules-alerts/_shared/` for API client, permission-aware components, styles, custom React Bootstrap dialogs, query helpers; adds root overview and routes.
- Does **not** replace your existing navbar, logos, sidebar, global stylesheet, or auth logic.

## Dependencies
`react`, `react-dom`, `react-bootstrap`, `bootstrap`, `@tanstack/react-query`, `react-router-dom` v6. The host app must already have a `QueryClientProvider`, authenticated React Router and Bootstrap styles.

## Routes: add inside existing authenticated layout
```
import { RulesAlertsProvider, RulesAlertsOverview, RuleEngine, AlertEngine, NotificationEngine, InterlockEngine, BypassGovernance, AuditTrail } from './rules-alerts';
// Existing QueryClientProvider/BrowserRouter + protected layout:
<RulesAlertsProvider request={config => authenticatedAxios.request(config)} can={permissionCode => verifiedPermissions.includes(permissionCode)}>
  <Routes>
    <Route path='/rules-alerts' element={<RulesAlertsOverview/>}/>
    <Route path='/rules-alerts/rule-engine' element={<RuleEngine/>}/>
    <Route path='/rules-alerts/alert-engine' element={<AlertEngine/>}/>
    <Route path='/rules-alerts/notification-engine' element={<NotificationEngine/>}/>
    <Route path='/rules-alerts/interlock-engine' element={<InterlockEngine/>}/>
    <Route path='/rules-alerts/bypass-governance' element={<BypassGovernance/>}/>
    <Route path='/rules-alerts/audit-trail' element={<AuditTrail/>}/>
  </Routes>
</RulesAlertsProvider>
```
The `authenticatedAxios` and `verifiedPermissions` names are INTEGRATION PLACEHOLDERS: use actual host auth/client and backend-supplied permission values, not browser-created roles. If you already have nested routes, add each Route to your existing `<Routes>`, **not** a second Router/Sidebar. Route objects and permission-based menu items are exported from `rulesAlertsRoutes.jsx`.

## API paths are from backend v3
- `rule-engine`: GET `/config`, `/config/:id`, `/runtime`; POST `/config`, `/evaluate`, `/evaluate-dispatch`.
- `alert-engine`: GET `/config`, `/runtime`; POST `/runtime`, `/runtime/:id/transition`, `/escalations/evaluate`.
- `notification-engine`: GET `/config`, `/runtime`; POST `/queue`, `/dispatch`.
- `interlock-engine`: GET `/config`, `/runtime`, `/latest`, `/blockers`; POST `/evaluate`, `/command`.
- `bypass-governance`: GET `/config`, `/runtime`; POST `/request`, `/request/:id/approve`, `/request/:id/activate`, `/request/:id/revoke`, `/expire`.
- `audit-trail`: GET `/config`, `/sensitive`, `/runtime`.

## UI business conditions
- Active-only operational dropdowns; no Active/Inactive/All filter. Historical rule versions can be viewed if returned by backend.
- Errors from backend are shown; no fake success messages or local insertions.
- Confirmation dialogs for irreversible/safety-sensitive commands; no `window.confirm` or browser alerts.
- Permissions are fail closed if host `can` callback absent. Backend enforcement is always authoritative.
- Field checks for UUIDs, JSON objects, mandatory reason, duration, idempotency, approval/transition, etc.
- PLC RELEASE is not offered: backend `evaluate` supports BLOCK only and RELEASE needs authoritative ALLOW plus verified PLC state.
- PLC BLOCK requires a selected BLOCK event, correct mapping, permission, and actual host gateway. A command may return FAILED with physical state unknown.
- Multi-level bypass requests require backend policy/workflow support and approver authorization; activation does not authorize PLC release.
- Email/SMS/webhook delivery and rule dispatch are dependent on backend host adapters; UI surfaces failures.
- Audit runtime can return 501 if deployed audit_log lacks required columns.

## Critical backend host limitations
Backend v3 still needs host.configure RBAC/action executor/notification provider/PLC gateway, mounting in app.js, deployed audit schema checks, scheduling, actual workflow.steps format and commissioning. This frontend cannot fix those omissions. Never commission to a live machine without completing integration and safety validation.

## Validation
Source files checked for JS/JSX syntax using TypeScript parser, and route/API references compared to backend v3. No live app build, end-to-end DB test or PLC commissioning performed. The uploaded ZIP was a scaffold and did not include your application's App.jsx, Sidebar, Axios client, auth context or package.json, so those cannot be patched automatically.
