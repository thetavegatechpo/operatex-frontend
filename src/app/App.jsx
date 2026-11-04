import React, { Suspense, useContext, useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes.jsx';
import WorkspaceBoundary from '../shared/components/WorkspaceBoundary.jsx';
import { AuthContext } from '../features/auth/context/AuthContext.jsx';
import api from '../shared/api/client.js';
import { RulesAlertsProvider } from '../features/rules-alerts/_shared/RulesAlertsUI.jsx';

// Use the host's existing authenticated axios instance; never create a second auth client.
const rulesAlertsRequest = config => api.request(config);

function RulesAlertsHost({ children }) {
  const { user } = useContext(AuthContext);
  // Accept only explicit permission codes issued by the authenticated backend.
  // Do not infer privileges from a role name or from a menu being visible.
  const permissions = useMemo(() => {
    const supplied = user?.permissions ?? user?.permission_codes ?? user?.permissionCodes;
    if (!Array.isArray(supplied)) return null;
    return new Set(supplied.map(p => typeof p === 'string' ? p : p?.permission_code).filter(p => typeof p === 'string' && p.trim()));
  }, [user]);
  const can = useMemo(() => permissions ? code => permissions.has(code) : undefined, [permissions]);
  return <RulesAlertsProvider request={rulesAlertsRequest} can={can}>{children}</RulesAlertsProvider>;
}

export default function App() {
  return <WorkspaceBoundary>
    <RulesAlertsHost>
      <BrowserRouter>
        <Suspense fallback={<div className="ox-visual-empty" role="status">Loading workspace…</div>}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </RulesAlertsHost>
  </WorkspaceBoundary>;
}
