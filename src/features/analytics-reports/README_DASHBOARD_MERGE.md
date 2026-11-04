# OperateX Analytics UI merge (2026-11-04)

Merged into user-supplied `src (6)(5).zip`.

## Replaced
- production-dashboard/pages/ProductionDashboard.jsx
- oee-dashboard/pages/OeeDashboard.jsx
- quality-dashboard/pages/QualityDashboard.jsx
- maintenance-dashboard/pages/MaintenanceDashboard.jsx
- traceability-dashboard/pages/TraceabilityDashboard.jsx

## Added
- _shared/AnalyticsDashboard.jsx
- _shared/AnalyticsDashboard.css

The seven existing React route registrations and layout/sidebar were preserved.
The Report Builder and AI Predictive Analytics pages are unchanged.

## Required backend
The Analytics & Reports backend from the previous phase must be running and mounted:
`GET /api/analytics-reports/<domain>-dashboard/source/<sourceKey>`
with authenticated requests and company scope.
The UI makes individual source requests because genealogy and maintenance views don't support all machine/date/shift filters.
Machine options are retrieved from `/api/machine-master/master`; if authorization blocks that endpoint, the machine filter is unavailable and All Machines remains usable.

## Data caution
This frontend does not invent production/OEE/quality values. Unavailable metrics are shown as —.
Production-event quantity is not guaranteed to equal finished part quantity; OEE summaries may include multiple machines/revisions; maintenance schedule counts represent current status. Reporting sources cap at 500 rows, so totals may be incomplete for long filters. The OEE KPI is the latest finalized row across the retrieved set, not a weighted aggregate; select a machine for machine OEE. All these limitations require backend reporting policy before official summaries.

## Validation
All new and changed JSX files checked using TypeScript JSX parser; no full Vite build attempted because this `src` archive does not include a package.json or node_modules.
