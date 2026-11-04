import React, { useEffect, useState } from "react";
import { getModuleStatus } from "../api/data-quality-monitor.service.js";
import "./DataQualityMonitor.css";

/** Integration shell only. No invented runtime records or success states. */
export default function DataQualityMonitor() {
  const [state, setState] = useState({ loading: true, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    getModuleStatus(controller.signal)
      .then(result => setState({ loading: false, error: result?.message || "Backend integration pending" }))
      .catch(err => { if (!controller.signal.aborted) setState({ loading: false, error: err.message }); });
    return () => controller.abort();
  }, []);
  return <main className="ox-module-shell">
    <header><span className="ox-module-area">Integration Governance</span><h1>Data Quality Monitor</h1></header>
    <section role="status" className="ox-module-panel">
      <strong>{state.loading ? "Checking backend integration…" : "Integration pending"}</strong>
      <p>{state.loading ? "" : state.error}</p>
      <p>This module is registered in the frontend and backend architecture, but requires validated database tables, company-scoped repository queries, permissions, and workflow rules before operational use.</p>
    </section>
  </main>;
}
