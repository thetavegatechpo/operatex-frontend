# Rules & Alerts — minimal POST controls update

This update uses your uploaded `rules-alerts (2).zip` as the base, with **no extra panels, KPI cards, or API-operation tiles**.

The five existing create/action forms are retained. Buttons are visible but **disabled unless the existing RulesAlertsProvider obtains the corresponding verified backend permission**. Read-only API verification never enables POST.

- Rule Engine: Add Rule Configuration, New Version, Evaluate Only, Evaluate & Dispatch.
- Alert Engine: Raise Alert, existing state transitions, Evaluate Due Escalations.
- Notification Engine: Queue Notification, Process Due Deliveries.
- Interlock Engine: Record BLOCK; PLC BLOCK only from eligible event row with COMMAND permission. RELEASE remains absent.
- Bypass Governance: Request Bypass, approval/rejection, activation, revocation, expiration.
- Audit Trail: read-only; backend offers no POST.

No POST /config is present in supplied backend for Alert, Notification, Interlock, Bypass or Audit. Their config tabs remain read-only. Existing forms trigger actual API functions; no dummy operations added.

For the buttons to be enabled, pass your **real authorized** `can(permissionCode)` resolver into RulesAlertsProvider. No Admin role-name bypass. The backend must enforce permissions too.

The modified JSX was inspected, but no full JSX compilation or live backend integration test has been performed.
