# Source folder guide

The design is preserved. The folders are organized around business modules.

| Folder or file | What belongs here |
| --- | --- |
| `src/main.jsx` | React startup and query provider |
| `src/app/App.jsx` | Router wrapper |
| `src/app/routes.jsx` | Existing page URLs and route definitions |
| `src/config/environment.js` | API URL and optional login company |
| `src/features/auth` | Login, auth API, context, session helpers and route guard |
| `src/features/dashboard` | Dashboard page |
| `src/features/enterprise-setup` | Enterprise setup modules |
| `src/features/master-data` | Master data modules and machine validation |
| `src/features/planning` | Planning modules |
| `src/features/production-execution` | Production execution modules |
| `src/features/oee-loss` | Availability, performance, quality, reliability and Loss Tree modules |
| `src/shared/api/client.js` | Axios settings, token header and session error handling |
| `src/shared/components` | Reusable UI components |
| `src/shared/layout` | Existing shell, navigation and sidebar |
| `src/shared/hooks` | Reusable hooks |
| `src/shared/utils` | Shared validation, export and other helpers |
| `src/styles` | Existing global CSS |
| `src/assets` | Existing images |

Inside each business module, `pages` contains its existing page and styles; `api` contains its existing API service where one exists. Add module-specific code in that module, and shared code in `shared`. Keep styles in their existing import order.

`SOURCE_PATH_MAP.json` maps every original source file to its new path. The old `App.jsx` was split: the wrapper is `app/App.jsx`, and its route definitions are `app/routes.jsx`. No route URLs changed.

## Configuration

`VITE_API_BASE_URL` sets the API address. With no value, requests use `/api` on the frontend origin; configure your deployment proxy accordingly. For a separate local backend use `http://localhost:5000/api` or your actual port.

`VITE_LOGIN_COMPANY_ID` is optional. Set it only when an account needs an explicit login company. Browser environment values are public, so do not place secrets in these settings. Restart Vite after editing `.env`, and rebuild production files after changing environment settings.

Runtime rules, formulas, master records, permissions and scheduler settings remain managed by the backend/database. Moving frontend folders does not validate those business settings.

## Verification

Run `npm run check:frontend` and `npm run build`. The source check validates imports and tests session/API error behavior. Live API, database, module calculations and browser interaction still need integration testing in your environment. The build has a large-bundle warning; the original static page and CSS imports were retained to preserve styling behavior.
