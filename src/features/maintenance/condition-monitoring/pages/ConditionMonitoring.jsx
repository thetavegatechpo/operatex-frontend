import React, { useEffect, useState } from "react";
import { getStatus } from "../api/condition-monitoring.service.js";
import "./ConditionMonitoring.css";

/** Navigation-ready page; does not simulate live manufacturing activity. */
export default function ConditionMonitoring() {
  const [state,setState] = useState({loading:true,message:""});
  useEffect(() => {
    let live=true;
    getStatus().then(r=>{if(live)setState({loading:false,message:r?.data?.message||"Backend integration pending"})})
      .catch(err=>{if(live)setState({loading:false,message:err?.response?.data?.message||err?.message||"Unable to fetch module status"})});
    return ()=>{live=false};
  },[]);
  return <main className="ox-extra-shell">
    <header className="ox-extra-header"><small>Maintenance Management</small><h1>Condition Monitoring</h1></header>
    <section className="ox-extra-panel" role="status">
      <h2>{state.loading?"Checking integration…":"Integration pending"}</h2>
      <p>{state.message}</p>
      <p>The page is connected to an authenticated backend status endpoint. Operational actions will be available only after tenant-scoped database queries, workflow validation and role permissions are implemented.</p>
    </section>
  </main>;
}
