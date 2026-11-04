import React, { useEffect, useState } from "react";
import { getModuleStatus } from "../api/unit-serial-vin-engine-id.service.js";
import "./UnitSerialVinEngineId.css";

/** Integration shell only. No invented runtime records or success states. */
export default function UnitSerialVinEngineId() {
  const [state, setState] = useState({ loading: true, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    getModuleStatus(controller.signal)
      .then(result => setState({ loading: false, error: result?.message || "Backend integration pending" }))
      .catch(err => { if (!controller.signal.aborted) setState({ loading: false, error: err.message }); });
    return () => controller.abort();
  }, []);
  return <main className="ox-module-shell">
    <header><span className="ox-module-area">Traceability</span><h1>Unit Serial / VIN / Engine ID</h1></header>
    <section role="status" className="ox-module-panel">
      <strong>{state.loading ? "Checking backend integration…" : "Integration pending"}</strong>
      <p>{state.loading ? "" : state.error}</p>
      <p>This module is registered in the frontend and backend architecture, but requires validated database tables, company-scoped repository queries, permissions, and workflow rules before operational use.</p>
    </section>
  </main>;
}
