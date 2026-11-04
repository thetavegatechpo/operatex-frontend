/* All endpoints are grounded in OperateX Rules & Alerts backend v3 routes.
 * API credentials and tenant identity are supplied by the EXISTING host app.
 * Never insert company_id or role_id from a browser form. */
const roots = Object.freeze({
  rule: '/api/rule-engine',
  alert: '/api/alert-engine',
  notification: '/api/notification-engine',
  interlock: '/api/interlock-engine',
  bypass: '/api/bypass-governance',
  audit: '/api/audit-trail',
});

export function makeRulesAlertsApi({ request, baseURL = '' } = {}) {
  // Host can inject an axios-like request; otherwise cookie-session fetch is used.
  // For bearer-token auth, inject the project's authenticated Axios instance.
  const send = async (method, path, { params, body } = {}) => {
    const url = new URL(`${baseURL}${path}`, window.location.origin);
    for (const [key, value] of Object.entries(params || {})) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    let payload;
    if (request) {
      // The host axios client already uses /api as its baseURL.
      // Strip only that duplicate prefix for injected requests; fetch keeps /api.
      const relativePath = url.pathname.replace(/^\/api(?=\/)/, '') + url.search;
      const response = await request({ method, url: relativePath, data: body });
      payload = response?.data ?? response;
    } else {
      const response = await fetch(url, {
        method, credentials: 'include',
        headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      try { payload = text ? JSON.parse(text) : {}; } catch { throw new Error(`Invalid JSON response (HTTP ${response.status})`); }
      if (!response.ok) throw Object.assign(new Error(payload?.message || `HTTP ${response.status}`), { status: response.status, response: { data: payload } });
    }
    if (payload?.success === false) throw new Error(payload.message || payload.errors?.[0]?.message || 'Request failed');
    return payload?.data ?? payload;
  };
  const get = (name, path, params) => send('GET', roots[name] + path, { params });
  const post = (name, path, body) => send('POST', roots[name] + path, { body });
  return {
    rule: {
      config: (params) => get('rule', '/config', params),
      detail: (id) => get('rule', `/config/${encodeURIComponent(id)}`),
      create: (body) => post('rule', '/config', body),
      runtime: (params) => get('rule', '/runtime', params),
      evaluate: (body) => post('rule', '/evaluate', body),
      dispatch: (body) => post('rule', '/evaluate-dispatch', body),
    },
    alert: {
      config: () => get('alert', '/config'), runtime: (params) => get('alert', '/runtime', params),
      create: (body) => post('alert', '/runtime', body),
      transition: (id, body) => post('alert', `/runtime/${encodeURIComponent(id)}/transition`, body),
      escalate: (body) => post('alert', '/escalations/evaluate', body),
    },
    notification: {
      config: () => get('notification', '/config'), runtime: (params) => get('notification', '/runtime', params),
      queue: (body) => post('notification', '/queue', body),
      dispatch: (body) => post('notification', '/dispatch', body),
    },
    interlock: {
      config: () => get('interlock', '/config'), runtime: (params) => get('interlock', '/runtime', params),
      latest: (params) => get('interlock', '/latest', params),
      blockers: (params) => get('interlock', '/blockers', params),
      evaluate: (body) => post('interlock', '/evaluate', body),
      command: (body) => post('interlock', '/command', body),
    },
    bypass: {
      config: () => get('bypass', '/config'), runtime: (params) => get('bypass', '/runtime', params),
      request: (body) => post('bypass', '/request', body),
      approve: (id, body) => post('bypass', `/request/${encodeURIComponent(id)}/approve`, body),
      activate: (id) => post('bypass', `/request/${encodeURIComponent(id)}/activate`),
      revoke: (id) => post('bypass', `/request/${encodeURIComponent(id)}/revoke`),
      expire: () => post('bypass', '/expire', {}),
    },
    audit: {
      config: () => get('audit', '/config'), sensitive: () => get('audit', '/sensitive'),
      runtime: (params) => get('audit', '/runtime', params),
    },
  };
}
