OPERATEX FRONTEND - UPDATED SOURCE

Use this together with the updated backend supplied earlier.

HOW TO APPLY
1. Back up your current frontend folder.
2. Extract this ZIP into a new frontend folder. It contains the full source project.
3. Copy your existing .env into the new folder. Your private .env is not in this ZIP.
4. Check VITE_API_BASE_URL points to your backend API (including /api). Use .env.example as a guide.
5. Run: npm ci
6. Run: npm run check:frontend
7. Run: npm run build
8. Run: npm run dev

If updating the existing folder instead: replace the whole old src folder.
Do not merge the new src folders with the old layout. Copy package.json and
package-lock.json from this ZIP too. Keep your real .env and deployment settings.

WHAT CHANGED
- Source files are grouped by module. Each module keeps its pages and API service together.
- Shared layout, components, hooks and utilities have their own folders.
- App routes and API environment settings have central files.
- Expired sessions and damaged saved user details are handled safely.
- Incorrect login credentials stay on the login screen with an error.
- A 401 protected API response clears the session; a 403 does not log the user out.
- Cached data is cleared on login/logout and session changes.
- Loss Tree aggregation has a Shift choice: one shift or All shifts.
- Changing company/plant/line clears the selected shift. Clear filters keeps the company.

UI
Existing page layouts, colors, CSS and route URLs are preserved.
The necessary UI addition is the Shift selector in the Loss Tree aggregation dialog.
There is no new visual theme.

CHECKS COMPLETED
Production build passed. 122 source files parsed; 313 relative imports resolved.
12 auth/API regression checks passed. All 41 route paths were preserved.
39 page files have identical JSX; Loss Tree has the intentional changes above.
All 29 CSS files retain their rules; compiled CSS matches the earlier build.
A browser screenshot comparison was not performed.

STILL REQUIRED BEFORE MOVING TO THE NEXT MODULE
Run the frontend with your updated backend and actual database.
Check login, invalid password, logout, expired session and role permissions.
For each module through Loss Tree: load its masters, save its config, execute
its operation, reload the page and check runtime/report values against the database.
Test Loss Tree aggregation once with a selected shift and once with All shifts.
Verify quantities, seconds, cost and category totals against your expected data.
Confirm scheduler, gateway and external integration settings on the backend.
No live backend/database test is claimed in this package.

DETAILS
See STRUCTURE.md for folder locations.
See SOURCE_PATH_MAP.json to find where an old file moved.
See CHECK_RESULTS.json for verification results.
