# OperateX Rules & Alerts — Add / Create UI actions

The user's uploaded `rules-alerts (2).zip` was used as source. All six pages and their existing folder structure are retained.

## Actions supported by existing backend v3
- Rule Engine: **Add Rule Configuration**, evaluate, dispatch. `POST /api/rule-engine/config` is the only new configuration-create endpoint among the six.
- Alert Engine: **Raise Alert**, transition status, escalation evaluation. POST alert runtime. No POST alert configuration.
- Notification Engine: **Queue Notification**, dispatch. No POST channel configuration.
- Interlock Engine: **Record BLOCK**, inspect blockers, restricted PLC BLOCK command. No POST interlock configuration or RELEASE.
- Bypass Governance: **Request Bypass**, approved workflow actions, activate, revoke and expire (subject to backend + verified privileges). No POST bypass policy config.
- Audit Trail: read only; no data-create endpoint.

## Authorization behavior
- Create/queue/request modal buttons are visible to users with server-verified READ access; submission is **still checked by the backend POST permission guard**. A 403 response is displayed, not bypassed.
- Sensitive actions such as APPROVE, ACTIVATE, REVOKE, DISPATCH, COMMAND and EVALUATE continue requiring explicitly verified frontend permissions.
- This does not replace the RBAC resolver. To make POST operations succeed, assign the matching permissions via existing OperateX RBAC and wire the provider's `can()` callback to backend-issued permissions.
- No frontend company ID, role ID or machine ID is hardcoded.
- New configuration creation for Alert, Notification, Interlock, Bypass and Audit needs a corresponding backend write route and service before a functioning Create Config UI can be added.

## Installation
Extract `rules-alerts/` into your existing `src/features/rules-alerts/` directory, preserving import paths. Keep the rest of the OperateX application, navbar and sidebar as-is.

## Verification
JavaScript/JSX syntax parsed after patch. No live database/PLC integration test performed.
